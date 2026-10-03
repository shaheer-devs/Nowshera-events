const API_URL = "http://127.0.0.1:8000";


function getToken() {

    return localStorage.getItem("token");

}


function checkAdminLogin() {

    const token = getToken();

    const userData = localStorage.getItem("user");


    if (!token || !userData) {

        window.location.href = "../login.html";

        return false;

    }


    const user = JSON.parse(userData);


    if (user.role !== "admin") {

        alert("Admin access required.");

        window.location.href = "../events.html";

        return false;

    }


    return true;

}


/* ==============================
   ADMIN DASHBOARD
   ============================== */

async function loadDashboard() {

    if (!checkAdminLogin()) {
        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/admin/dashboard`,
            {
                headers: {
                    "Authorization":
                        `Bearer ${getToken()}`
                }
            }
        );


        const data = await response.json();


        if (!response.ok) {

            document.getElementById(
                "dashboardMessage"
            ).textContent =
                data.detail || "Unable to load dashboard.";

            return;
        }


        document.getElementById("totalEvents").textContent =
            data.events.total;

        document.getElementById("draftEvents").textContent =
            data.events.draft;

        document.getElementById("publishedEvents").textContent =
            data.events.published;

        document.getElementById("completedEvents").textContent =
            data.events.completed;

        document.getElementById("cancelledEvents").textContent =
            data.events.cancelled;

        document.getElementById("totalRegistrations").textContent =
            data.registrations.total;

        document.getElementById("activeRegistrations").textContent =
            data.registrations.active;

        document.getElementById("cancelledRegistrations").textContent =
            data.registrations.cancelled;


        document.getElementById(
            "dashboardMessage"
        ).textContent = "";


    } catch (error) {

        document.getElementById(
            "dashboardMessage"
        ).textContent =
            "Could not connect to the server.";

        console.error(error);

    }

}


if (document.getElementById("totalEvents")) {

    loadDashboard();

}

/* ==============================
   ADMIN EVENTS
   ============================== */

/* ==============================
   ADMIN EVENTS
   ============================== */

async function loadAdminEvents() {

    if (!checkAdminLogin()) {
        return;
    }

    const container =
        document.getElementById(
            "adminEventsContainer"
        );

    if (!container) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/events`,
            {
                headers: {
                    "Authorization":
                        `Bearer ${getToken()}`
                }
            }
        );

        const data =
            await response.json();

        if (!response.ok) {

            container.innerHTML =
                `<p>${data.detail || "Unable to load events."}</p>`;

            return;
        }

        if (data.events.length === 0) {

            container.innerHTML =
                "<p>No events found.</p>";

            return;
        }

        container.innerHTML = "";

        data.events.forEach(function (event) {

            const card =
                document.createElement("div");

            card.className =
                "admin-event-card";


            card.innerHTML = `

                <h2>
                    ${event.title}
                </h2>

                <p>
                    ${event.description || ""}
                </p>

                <p>
                    <strong>Date:</strong>
                    ${event.event_date}
                </p>

                <p>
                    <strong>Time:</strong>
                    ${event.event_time}
                </p>

                <p>
                    <strong>Location:</strong>
                    ${event.location}
                </p>

                <p>
                    <strong>Capacity:</strong>
                    ${event.capacity}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${event.status}
                </p>


                <div class="admin-buttons">


                    <!-- EDIT -->

                    <button
                        class="btn"
                        onclick="editEvent(${event.id})"
                    >
                        Edit
                    </button>


                    <!-- PUBLISH -->

                    ${
                        event.status === "draft"
                        ?
                        `
                        <button
                            class="btn"
                            onclick="publishEvent(${event.id})"
                        >
                            Publish
                        </button>
                        `
                        :
                        ""
                    }


                    <!-- COMPLETE -->

                    ${
                        event.status === "published"
                        ?
                        `
                        <button
                            class="btn"
                            onclick="completeEvent(${event.id})"
                        >
                            Complete
                        </button>
                        `
                        :
                        ""
                    }


                    <!-- CANCEL -->

                    ${
                        event.status !== "cancelled" &&
                        event.status !== "completed"
                        ?
                        `
                        <button
                            class="danger-btn"
                            onclick="cancelEvent(${event.id})"
                        >
                            Cancel
                        </button>
                        `
                        :
                        ""
                    }


                    <!-- VIEW ATTENDEES -->

                    <button
                        class="btn"
                        onclick="viewAttendees(${event.id})"
                    >
                        View Attendees
                    </button>


                </div>

            `;

            container.appendChild(card);

        });

    } catch (error) {

        container.innerHTML =
            "<p>Could not connect to server.</p>";

        console.error(error);

    }

}


/* ==============================
   PUBLISH EVENT
   ============================== */

async function publishEvent(eventId) {

    await changeEventStatus(
        eventId,
        "publish"
    );

}


/* ==============================
   COMPLETE EVENT
   ============================== */

async function completeEvent(eventId) {

    await changeEventStatus(
        eventId,
        "complete"
    );

}


/* ==============================
   CANCEL EVENT
   ============================== */

async function cancelEvent(eventId) {

    const confirmed =
        confirm(
            "Are you sure you want to cancel this event?"
        );

    if (!confirmed) {
        return;
    }

    await changeEventStatus(
        eventId,
        "cancel"
    );

}


/* ==============================
   CHANGE EVENT STATUS
   ============================== */

async function changeEventStatus(
    eventId,
    action
) {

    try {

        const response = await fetch(
            `${API_URL}/events/${eventId}/${action}`,
            {
                method: "PATCH",

                headers: {
                    "Authorization":
                        `Bearer ${getToken()}`
                }
            }
        );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.detail ||
                "Action failed."
            );

            return;
        }

        alert(
            data.message ||
            "Action completed successfully."
        );

        loadAdminEvents();

    } catch (error) {

        alert(
            "Could not connect to server."
        );

        console.error(error);

    }

}


/* ==============================
   VIEW ATTENDEES
   ============================== */

function viewAttendees(eventId) {

    window.location.href =
        `attendees.html?event_id=${eventId}`;

}


/* ==============================
   LOAD ADMIN EVENTS
   ============================== */

if (
    document.getElementById(
        "adminEventsContainer"
    )
) {

    loadAdminEvents();

}


/* ==============================
   CREATE EVENT
   ============================== */

const createEventForm =
    document.getElementById(
        "createEventForm"
    );


if (createEventForm) {

    createEventForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const eventData = {

                title:
                    document.getElementById(
                        "eventTitle"
                    ).value,

                description:
                    document.getElementById(
                        "eventDescription"
                    ).value,

                event_date:
                    document.getElementById(
                        "eventDate"
                    ).value,

                event_time:
                    document.getElementById(
                        "eventTime"
                    ).value,

                location:
                    document.getElementById(
                        "eventLocation"
                    ).value,

                capacity:
                    parseInt(
                        document.getElementById(
                            "eventCapacity"
                        ).value
                    ),

                status:
                    document.getElementById(
                        "eventStatus"
                    ).value

            };


            try {

                const response =
                    await fetch(
                        `${API_URL}/events`,
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${getToken()}`

                            },

                            body:
                                JSON.stringify(
                                    eventData
                                )

                        }
                    );


                const data =
                    await response.json();


                const message =
                    document.getElementById(
                        "eventMessage"
                    );


                if (!response.ok) {

                    message.textContent =
                        data.detail ||
                        "Event creation failed.";

                    return;
                }


                message.textContent =
                    "Event created successfully!";


                createEventForm.reset();


                loadAdminEvents();


            } catch (error) {

                console.error(error);

                document.getElementById(
                    "eventMessage"
                ).textContent =
                    "Could not connect to server.";

            }

        }
    );

}

/* ==============================
   ATTENDEES
   ============================== */

let currentAttendees = [];


function getEventIdFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("event_id");

}


async function loadAttendees() {

    if (!checkAdminLogin()) {
        return;
    }


    const container =
        document.getElementById(
            "attendeesContainer"
        );


    if (!container) {
        return;
    }


    const eventId =
        getEventIdFromURL();


    if (!eventId) {

        container.innerHTML =
            "<p>No event selected.</p>";

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/admin/events/${eventId}/attendees`,
                {

                    headers: {
                        "Authorization":
                            `Bearer ${getToken()}`
                    }

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            container.innerHTML =
                `<p>${data.detail || "Unable to load attendees."}</p>`;

            return;
        }


        currentAttendees =
            data.attendees;


        document.getElementById(
            "attendeeSummary"
        ).innerHTML = `

            <p>
                <strong>Event:</strong>
                ${data.event.title}
            </p>

            <p>
                <strong>Capacity:</strong>
                ${data.event.capacity}
            </p>

            <p>
                <strong>Active:</strong>
                ${data.active_registrations}
            </p>

            <p>
                <strong>Places left:</strong>
                ${data.places_left}
            </p>

        `;


        displayAttendees(
            currentAttendees
        );


    } catch (error) {

        container.innerHTML =
            "<p>Could not connect to server.</p>";

        console.error(error);

    }

}


function displayAttendees(attendees) {

    const container =
        document.getElementById(
            "attendeesContainer"
        );


    if (attendees.length === 0) {

        container.innerHTML =
            "<p>No attendees found.</p>";

        return;
    }


    let html = `

        <table class="attendee-table">

            <thead>

                <tr>

                    <th>Name</th>

                    <th>Email</th>

                    <th>Status</th>

                    <th>Registered At</th>

                </tr>

            </thead>

            <tbody>

    `;


    attendees.forEach(function (attendee) {

        html += `

            <tr>

                <td>
                    ${attendee.full_name}
                </td>

                <td>
                    ${attendee.email}
                </td>

                <td>
                    ${attendee.status}
                </td>

                <td>
                    ${attendee.registered_at}
                </td>

            </tr>

        `;

    });


    html += `

            </tbody>

        </table>

    `;


    container.innerHTML = html;

}


const attendeeSearch =
    document.getElementById(
        "attendeeSearch"
    );

    const statusFilter =
    document.getElementById(
        "statusFilter"
    );


if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        function() {

            filterAttendees();

        }
    );

}


function filterAttendees() {

    const searchText =
        document.getElementById(
            "attendeeSearch"
        ).value.toLowerCase();


    const selectedStatus =
        document.getElementById(
            "statusFilter"
        ).value;


    const filtered =
        currentAttendees.filter(
            function(attendee) {

                const matchesSearch =
                    attendee.full_name
                        .toLowerCase()
                        .includes(searchText)
                    ||
                    attendee.email
                        .toLowerCase()
                        .includes(searchText);


                const matchesStatus =
                    selectedStatus === "all"
                    ||
                    attendee.status === selectedStatus;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    displayAttendees(filtered);

}


if (attendeeSearch) {

    attendeeSearch.addEventListener(
        "input",
        function () {

            const searchText =
                attendeeSearch.value.toLowerCase();


            const filtered =
                currentAttendees.filter(
                    function (attendee) {

                        return (

                            attendee.full_name
                                .toLowerCase()
                                .includes(searchText)

                            ||

                            attendee.email
                                .toLowerCase()
                                .includes(searchText)

                        );

                    }
                );


            displayAttendees(filtered);

        }
    );

}


function copyAttendees() {

    if (currentAttendees.length === 0) {

        alert("No attendees to copy.");

        return;
    }


    let text =
        "Name\tEmail\tStatus\tRegistered At\n";


    currentAttendees.forEach(
        function (attendee) {

            text +=
                `${attendee.full_name}\t` +
                `${attendee.email}\t` +
                `${attendee.status}\t` +
                `${attendee.registered_at}\n`;

        }
    );


    navigator.clipboard.writeText(text);


    alert("Attendee list copied.");

}


function exportAttendees() {

    if (currentAttendees.length === 0) {

        alert("No attendees to export.");

        return;
    }


    let csv =
        "Name,Email,Status,Registered At\n";


    currentAttendees.forEach(
        function (attendee) {

            csv +=
                `"${attendee.full_name}",` +
                `"${attendee.email}",` +
                `"${attendee.status}",` +
                `"${attendee.registered_at}"\n`;

        }
    );


    const blob =
        new Blob(
            [csv],
            {
                type: "text/csv"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        "attendees.csv";


    link.click();


    URL.revokeObjectURL(url);

}


if (document.getElementById(
    "attendeesContainer"
)) {

    loadAttendees();

}

async function editEvent(eventId) {

    const title = prompt("Enter new event title:");

    if (title === null) {
        return;
    }

    const description =
        prompt("Enter new description:");

    if (description === null) {
        return;
    }

    const eventDate =
        prompt("Enter event date (YYYY-MM-DD):");

    if (eventDate === null) {
        return;
    }

    const eventTime =
        prompt("Enter event time (HH:MM):");

    if (eventTime === null) {
        return;
    }

    const location =
        prompt("Enter event location:");

    if (location === null) {
        return;
    }

    const capacity =
        prompt("Enter event capacity:");

    if (capacity === null) {
        return;
    }


    const updateData = {

        title: title,
        description: description,
        event_date: eventDate,
        event_time: eventTime,
        location: location,
        capacity: parseInt(capacity)

    };


    try {

        const response = await fetch(
            `${API_URL}/events/${eventId}`,
            {

                method: "PUT",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${getToken()}`

                },

                body:
                    JSON.stringify(updateData)

            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.detail ||
                "Event update failed."
            );

            return;
        }


        alert(
            "Event updated successfully."
        );


        loadAdminEvents();


    } catch (error) {

        alert(
            "Could not connect to server."
        );

        console.error(error);

    }

}


function adminLogout() {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    window.location.href =
        "../login.html";

}