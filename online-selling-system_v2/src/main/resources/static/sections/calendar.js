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

      // Reset events object
      this.config.events = {};

      // Group orders by date
      orders
        .filter(order => order && order.dateOfEvent)
        .forEach(order => {
          const dateKey = order.dateOfEvent.split('T')[0]; // Get just the date part
          if (!this.config.events[dateKey]) {
            this.config.events[dateKey] = [];
          }

          this.config.events[dateKey].push({
            time: order.dateOfEvent.split('T')[1]?.substring(0, 5) || '00:00',
            title: `${order.customerName || 'No Customer'} - ${order.status || 'PENDING'}`,
            description: `
              Products: ${Array.isArray(order.orderItems) ? 
                order.orderItems.map(item => item.productName).join(", ") : 
                'No products'}
              Total: KES ${order.totalAmount || 0}
              Paid: KES ${order.paidAmount || 0}
              Balance: KES ${order.remainingAmount || 0}
            `,
            color: getStatusColor(order.status)
          });
        });

      // Re-render calendar with new events
      this.renderCalendar();
      
      // If a date is selected, update its events display
      if (this.config.selectedDate) {
        const dateStr = this.config.selectedDate.toISOString().split('T')[0];
        this.displayEvents(dateStr);
      }

    } catch (error) {
      console.error("Error fetching orders:", error);
      this.config.events = {}; // Clear events on error
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
          </div>
          <div class="event-description">${event.description}</div>
          <div class="event-actions">
            <button class="edit">Edit</button>
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
          console.log('Edit event:', event);
        });
      });
    } else {
      const listItem = document.createElement('li');
      listItem.textContent = "No events for this day.";
      this.config.elements.eventItems.appendChild(listItem);
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