const API_URL = "https://YOUR-RAILWAY-URL.up.railway.app";


// ==========================================
// LOAD PUBLIC EVENTS
// ==========================================

async function loadEvents() {

    const container =
        document.getElementById("eventsContainer");

    if (!container) {
        return;
    }

    try {

        const response =
            await fetch(`${API_URL}/public/events`);

        const data =
            await response.json();

        if (!response.ok) {

            container.innerHTML =
                `<p>${data.detail || "Unable to load events."}</p>`;

            return;
        }

        if (data.events.length === 0) {

            container.innerHTML =
                "<p>No upcoming events available.</p>";

            return;
        }

        container.innerHTML = "";

        data.events.forEach(function(event) {

            const card =
                document.createElement("div");

            card.className = "event-card";

            card.innerHTML = `

                <h2>${event.title}</h2>

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
                    <strong>Places left:</strong>
                    ${event.places_left}
                </p>

                <a
                    href="event-details.html?id=${event.id}"
                    class="btn"
                >
                    View Details
                </a>

            `;

            container.appendChild(card);

        });

    } catch (error) {

        container.innerHTML =
            "<p>Could not connect to server.</p>";

        console.error(error);

    }

}



// ==========================================
// LOAD EVENT DETAILS
// ==========================================

async function loadEventDetails() {

    const container =
        document.getElementById("eventDetails");

    if (!container) {
        return;
    }

    const urlParams =
        new URLSearchParams(window.location.search);

    const eventId =
        urlParams.get("id");

    if (!eventId) {

        container.innerHTML =
            "<p>Event not found.</p>";

        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/public/events/${eventId}`
            );

        const data =
            await response.json();

        if (!response.ok) {

            container.innerHTML =
                `<p>${data.detail || "Unable to load event."}</p>`;

            return;
        }

        const event =
            data.event;

        container.innerHTML = `

            <div class="event-card">

                <h1>
                    ${event.title}
                </h1>

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
                    <strong>Places left:</strong>
                    ${event.places_left}
                </p>

                ${
                    event.places_left > 0
                    ?
                    `
                    <button
                        class="btn"
                        onclick="registerForEvent(${event.id})"
                    >
                        Register for Event
                    </button>
                    `
                    :
                    `
                    <p>
                        <strong>This event is full.</strong>
                    </p>
                    `
                }

            </div>

        `;

    } catch (error) {

        container.innerHTML =
            "<p>Could not connect to server.</p>";

        console.error(error);

    }

}



// ==========================================
// REGISTER FOR EVENT
// ==========================================

async function registerForEvent(eventId) {

    const token =
        localStorage.getItem("token");

    if (!token) {

        alert("Please login first.");

        window.location.href =
            "login.html";

        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/registrations`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        event_id: eventId
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.detail ||
                "Registration failed."
            );

            return;
        }

        alert(
            data.message ||
            "Registration successful!"
        );

        window.location.href =
            "registrations.html";

    } catch (error) {

        alert(
            "Could not connect to server."
        );

        console.error(error);

    }

}



// ==========================================
// LOAD MY REGISTRATIONS
// ==========================================

async function loadMyRegistrations() {

    const container =
        document.getElementById(
            "registrationsContainer"
        );

    if (!container) {
        return;
    }

    const token =
        localStorage.getItem("token");

    if (!token) {

        container.innerHTML = `
            <p>
                Please
                <a href="login.html">login</a>
                to see your registrations.
            </p>
        `;

        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/my-registrations`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            container.innerHTML =
                `<p>${data.detail || "Unable to load registrations."}</p>`;

            return;
        }

        if (data.registrations.length === 0) {

            container.innerHTML =
                "<p>You have no registrations.</p>";

            return;
        }

        container.innerHTML = "";

        data.registrations.forEach(
            function(registration) {

                const card =
                    document.createElement("div");

                card.className =
                    "event-card";

                card.innerHTML = `

                    <h2>
                        ${registration.event.title}
                    </h2>

                    <p>
                        ${registration.event.description || ""}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${registration.event.event_date}
                    </p>

                    <p>
                        <strong>Time:</strong>
                        ${registration.event.event_time}
                    </p>

                    <p>
                        <strong>Location:</strong>
                        ${registration.event.location}
                    </p>

                    <p>
                        <strong>Capacity:</strong>
                        ${registration.event.capacity}
                    </p>

                    <p>
                        <strong>Registration Status:</strong>
                        ${registration.status}
                    </p>

                    <p>
                        <strong>Registered At:</strong>
                        ${registration.registered_at}
                    </p>

                    ${
                        registration.status === "registered"
                        ?
                        `
                        <button
                            class="btn"
                            onclick="cancelRegistration(${registration.registration_id})"
                        >
                            Cancel Registration
                        </button>
                        `
                        :
                        `
                        <p>
                            <strong>
                                Registration cancelled.
                            </strong>
                        </p>
                        `
                    }

                `;

                container.appendChild(card);

            }
        );

    } catch (error) {

        container.innerHTML =
            "<p>Could not connect to server.</p>";

        console.error(error);

    }

}



// ==========================================
// CANCEL REGISTRATION
// ==========================================

async function cancelRegistration(
    registrationId
) {

    const token =
        localStorage.getItem("token");

    if (!token) {

        alert("Please login first.");

        window.location.href =
            "login.html";

        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/registrations/${registrationId}/cancel`,
                {
                    method: "PATCH",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.detail ||
                "Cancellation failed."
            );

            return;
        }

        alert(
            data.message ||
            "Registration cancelled successfully!"
        );

        loadMyRegistrations();

    } catch (error) {

        alert(
            "Could not connect to server."
        );

        console.error(error);

    }

}



// ==========================================
// RUN ONLY THE FUNCTION NEEDED BY THE PAGE
// ==========================================

if (
    document.getElementById(
        "eventsContainer"
    )
) {

    loadEvents();

}


if (
    document.getElementById(
        "eventDetails"
    )
) {

    loadEventDetails();

}


if (
    document.getElementById(
        "registrationsContainer"
    )
) {

    loadMyRegistrations();

}
