import { orderBaseUrl } from '../modules/apiConstants.js';
import { showLoadingSpinner, hideLoadingSpinner, debounce } from '../modules/utility.js';
import { getStatusColor } from '../modules/status.js';

export const CalendarModule = {
  config: {
    elements: {
      monthYear: document.getElementById('month-year'),
      calendarDays: document.getElementById('calendar-days'),
      prevMonth: document.getElementById('prev-month'),
      nextMonth: document.getElementById('next-month'),
      selectedDate: document.getElementById('selected-date'),
      eventItems: document.getElementById('event-items'),
      calendar: $('#calendar')
    },
    currentDate: new Date(),
    selectedDate: null,
    events: {} // Initialize empty events object
  },

  /**
   * Fetch orders from the backend and render them on the calendar.
   */
  async fetchAndRenderOrders() {
    showLoadingSpinner();
    try {
      const response = await fetch(orderBaseUrl);
      if (!response.ok) throw new Error("Failed to fetch orders");
      const orders = await response.json();

      if (!Array.isArray(orders)) {
        throw new Error("Invalid orders data received");
      }

      this.config.events = {};

      orders
        .filter(order => order && order.dateOfEvent)
        .forEach(order => {
          const dateKey = order.dateOfEvent.split('T')[0];
          if (!this.config.events[dateKey]) {
            this.config.events[dateKey] = [];
          }

          const productsDescription = order.orderItems ? 
            order.orderItems.map(item => 
              `${item.productName} × ${item.quantity} = KES ${(item.itemPrice * item.quantity).toFixed(2)}`
            ).join('\n') : 
            'No products';

          this.config.events[dateKey].push({
            id: order.id,
            time: order.dateOfEvent.split('T')[1]?.substring(0, 5) || '00:00',
            title: `${order.customerName || 'No Customer'} - ${order.status || 'PENDING'}`,
            status: order.status,
            orderItems: order.orderItems || [],
            description: productsDescription,
            totalAmount: order.totalAmount || 0,
            paidAmount: order.paidAmount || 0,
            remainingAmount: order.remainingAmount || 0,
            color: getStatusColor(order.status)
          });
        });

      this.renderCalendar();
      
      if (this.config.selectedDate) {
        const dateStr = this.config.selectedDate.toISOString().split('T')[0];
        this.displayEvents(dateStr);
      }

    } catch (error) {
      console.error("Error fetching orders:", error);
      this.config.events = {};
    } finally {
      hideLoadingSpinner();
    }
  },

  /**
   * Initialize the FullCalendar with configuration and event handlers.
   */
  initializeFullCalendar() {
    const self = this;
    this.config.elements.calendar.fullCalendar({
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay'
      },
      editable: true,
      eventLimit: true,
      events: [],
      dayRender(date, cell) {
        cell.css('min-height', '80px');
        const dateStr = date.format('YYYY-MM-DD');
        const events = self.config.elements.calendar.fullCalendar('clientEvents', event => event.start.format('YYYY-MM-DD') === dateStr);
        if (events.length > 0) {
          const indicator = $('<span class="event-indicator"></span>');
          cell.append(indicator);
        }
      },
      eventRender: (event, element) => this.eventRender(event, element),
      eventClick(event) {
        alert(`
          ${event.title}
          Time: ${event.start.format('HH:mm')}
          ${event.description || ''}
        `);
      }
    });
  },

  /**
   * Render event with additional information and actions.
   */
  eventRender(event, element) {
    element.css({
      'border-radius': '4px',
      'border': 'none',
      'padding': '4px 8px',
      'margin': '1px 2px'
    });

    // Add tooltip with detailed information
    const tooltip = `
      <div class="event-tooltip">
        <strong>${event.title}</strong><br>
        ${event.extendedProps ? `
          Customer: ${event.extendedProps.customerNumber}<br>
          Products: ${event.extendedProps.products}<br>
          Total: KES ${event.extendedProps.totalAmount}<br>
          Paid: KES ${event.extendedProps.paidAmount}<br>
          Remaining: KES ${event.extendedProps.remainingAmount}
        ` : ''}
      </div>
    `;
    element.attr('title', tooltip);

    const actions = $(`
      <div class="event-actions">
        <button class="edit">Edit</button>
        <button class="delete">Delete</button>
      </div>
    `);
    element.append(actions);

    actions.find('.edit').click(function(e) {
      e.stopPropagation();
      console.log('Edit event:', event);
    });

    actions.find('.delete').click(function(e) {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this event?')) {
        self.config.elements.calendar.fullCalendar('removeEvents', event._id);
        // Add API call to delete event from backend
      }
    });
  },

  /**
   * Initialize event listeners for calendar navigation and resizing.
   */
  initializeEventListeners() {
    this.config.elements.prevMonth.addEventListener('click', () => {
      this.config.currentDate.setMonth(this.config.currentDate.getMonth() - 1);
      this.renderCalendar();
    });

    this.config.elements.nextMonth.addEventListener('click', () => {
      this.config.currentDate.setMonth(this.config.currentDate.getMonth() + 1);
      this.renderCalendar();
    });

    window.addEventListener("resize", debounce(() => {
      this.config.elements.calendar.fullCalendar('render');
    }, 250));
  },

  /**
   * Render the calendar for the current month and year.
   */
  renderCalendar() {
    const year = this.config.currentDate.getFullYear();
    const month = this.config.currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDay = firstDayOfMonth.getDay();

    this.config.elements.monthYear.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(this.config.currentDate);
    this.config.elements.calendarDays.innerHTML = '';

    // Render empty days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      const dayElement = document.createElement('div');
      dayElement.classList.add('calendar-day', 'inactive');
      this.config.elements.calendarDays.appendChild(dayElement);
    }

    // Render days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      dayElement.classList.add('calendar-day');
      dayElement.textContent = day;

      const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      if (year === new Date().getFullYear() && month === new Date().getMonth() && day === new Date().getDate()) {
        dayElement.classList.add('today');
      }

      if (this.config.selectedDate && fullDate === `${this.config.selectedDate.getFullYear()}-${String(this.config.selectedDate.getMonth() + 1).padStart(2, '0')}-${String(this.config.selectedDate.getDate()).padStart(2, '0')}`) {
        dayElement.classList.add('selected');
      }

      if (this.config.events[fullDate]) {
        const eventIndicator = document.createElement('span');
        eventIndicator.classList.add('event-indicator');
        dayElement.appendChild(eventIndicator);
      }

      dayElement.addEventListener('click', () => {
        this.config.selectedDate = new Date(year, month, day);
        this.renderCalendar();
        this.displayEvents(fullDate);
      });

      this.config.elements.calendarDays.appendChild(dayElement);
    }
  },

  /**
   * Display events for the selected date.
   * @param {string} dateString - The date string in YYYY-MM-DD format.
   */
  displayEvents(dateString) {
    this.config.elements.selectedDate.textContent = new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(new Date(dateString));
    
    this.config.elements.eventItems.innerHTML = '';

    const events = this.config.events[dateString] || [];
    
    if (events.length > 0) {
      events.forEach(event => {
        const listItem = document.createElement('li');
        listItem.classList.add('event-item');
        listItem.style.borderLeft = `4px solid ${event.color || '#4CAF50'}`;
        
        listItem.innerHTML = `
          <div class="event-header">
            <span class="event-time">${event.time}</span>
            <span class="event-title">${event.title}</span>
            <div class="status-control">
              <select class="status-select">
                <option value="COMPLETED" ${event.status === 'COMPLETED' ? 'selected' : ''}>Completed</option>
                <option value="CANCELLED" ${event.status === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
              </select>
              <button class="update-status" title="Update Status">✓</button>
            </div>
          </div>
          <div class="event-description">
            <pre class="products-list">${event.description}</pre>
            <div class="totals">
              Total: KES ${event.totalAmount.toFixed(2)}
              Paid: KES ${event.paidAmount.toFixed(2)}
              Balance: KES ${event.remainingAmount.toFixed(2)}
            </div>
          </div>
          <div class="event-actions">
            <button class="edit">Edit Payment</button>
            <button class="delete">Delete</button>
          </div>
        `;

        this.config.elements.eventItems.appendChild(listItem);

        // Add event listeners for buttons
        const deleteButton = listItem.querySelector('.delete');
        deleteButton.addEventListener('click', () => {
          const index = this.config.events[dateString].indexOf(event);
          if (index > -1) {
            this.config.events[dateString].splice(index, 1);
          }
          this.displayEvents(dateString);
        });

        const editButton = listItem.querySelector('.edit');
        editButton.addEventListener('click', () => {
          this.showPaymentModal(event);
        });

        // Add status update listener
        const statusSelect = listItem.querySelector('.status-select');
        const updateStatusBtn = listItem.querySelector('.update-status');
        updateStatusBtn.addEventListener('click', async () => {
          const newStatus = statusSelect.value;
          try {
            await fetch(`${orderBaseUrl}/${event.id}/status`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ newStatus })
            });
            await this.fetchAndRenderOrders();
          } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
          }
        });
      });
    } else {
      const listItem = document.createElement('li');
      listItem.textContent = "No events for this day.";
      this.config.elements.eventItems.appendChild(listItem);
    }
  },

  showPaymentModal(event) {
    const modal = document.getElementById('payment-modal');
    const modalTotal = document.getElementById('modal-total');
    const modalPaid = document.getElementById('modal-paid');
    const modalRemaining = document.getElementById('modal-remaining');
    const paymentForm = document.getElementById('payment-form');
    const paymentInput = document.getElementById('payment-amount');
    const closeBtn = modal.querySelector('.close');

    modalTotal.textContent = `KES ${event.totalAmount.toFixed(2)}`;
    modalPaid.textContent = `KES ${event.paidAmount.toFixed(2)}`;
    modalRemaining.textContent = `KES ${event.remainingAmount.toFixed(2)}`;
    
    paymentInput.max = event.remainingAmount;
    paymentInput.value = '';

    modal.style.display = 'block';

    const handleSubmit = async (e) => {
        e.preventDefault();
        const amount = parseFloat(paymentInput.value);
        
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid payment amount greater than zero');
            return;
        }

        // Only check against remaining amount
        if (amount > event.remainingAmount) {
            alert(`Payment amount cannot exceed remaining balance: ${event.remainingAmount}`);
            return;
        }

        const submitButton = paymentForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Updating...';

        try {
            await this.updatePaidAmount(event.id, amount);
            await this.fetchAndRenderOrders();
            modal.style.display = 'none';
        } catch (error) {
            alert(error.message);
            if (error.message.includes('concurrent modification')) {
                // Refresh data and keep modal open
                await this.fetchAndRenderOrders();
            }
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Update Payment';
        }
    };

    const closeModal = () => {
        modal.style.display = 'none';
        paymentForm.removeEventListener('submit', handleSubmit);
        closeBtn.removeEventListener('click', closeModal);
    };

    paymentForm.addEventListener('submit', handleSubmit);
    closeBtn.addEventListener('click', closeModal);
    
    window.onclick = (event) => {
        if (event.target === modal) {
            closeModal();
        }
    };
  },

  async updatePaidAmount(orderId, amount) {
    try {
        const paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            throw new Error('Payment amount must be greater than zero');
        }

        const response = await fetch(`${orderBaseUrl}/${orderId}/paid?paidAmount=${paymentAmount.toFixed(2)}`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 500 && errorData.error?.includes('was updated or deleted by another transaction')) {
                throw new Error('Payment update failed due to concurrent modification. Please try again.');
            }
            throw new Error(errorData.error || 'Failed to update payment');
        }

        return await response.json();
    } catch (error) {
        console.error('Payment update error:', error);
        throw new Error(error.message || 'Failed to update payment. Please try again.');
    }
  },

  /**
   * Initialize the calendar module.
   */
  init() {
    this.initializeFullCalendar();
    this.initializeEventListeners();
    this.renderCalendar();
    this.fetchAndRenderOrders();

    const todayString = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    this.displayEvents(todayString);
  }
};

export default CalendarModule;