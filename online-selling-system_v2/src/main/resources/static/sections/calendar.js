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
    events: {
      "2024-01-15": [{ time: "10:00", title: "Meeting with John", description: "Discuss project updates" },
                    { time: "14:00", title: "Project Deadline", description: "Submit final report" }],
      "2024-01-22": [{ time: "12:30", title: "Team Lunch", description: "Celebrate project milestone" }],
      "2024-02-10": [{ time: "19:00", title: "Client Dinner", description: "Formal dinner with key client" }]
    }
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

      const events = orders.map(order => ({
        title: `${order.customerName} - ${order.status}`,
        start: order.date,
        color: getStatusColor(order.status),
        extendedProps: {
          customerNumber: order.customerNumber,
          products: order.products.map(p => p.name).join(", "),
          totalAmount: order.totalAmount,
          paidAmount: order.paidAmount,
          remainingAmount: order.remainingAmount
        }
      }));

      this.config.elements.calendar.fullCalendar('removeEvents');
      this.config.elements.calendar.fullCalendar('addEventSource', events);
    } catch (error) {
      console.error("Error fetching orders:", error);
      alert("Error loading calendar events. Please try again.");
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
      eventRender(event, element) {
        element.css({
          'border-radius': '4px',
          'border': 'none',
          'padding': '4px 8px',
          'margin': '1px 2px'
        });

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
    this.config.elements.selectedDate.textContent = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateString));
    this.config.elements.eventItems.innerHTML = '';

    if (this.config.events[dateString]) {
      this.config.events[dateString].forEach(event => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
          <span class="event-time">${event.time}</span>
          <span class="event-title">${event.title}</span>
          <div class="event-actions">
            <button class="edit">Edit</button>
            <button class="delete">Delete</button>
          </div>
        `;
        this.config.elements.eventItems.appendChild(listItem);

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