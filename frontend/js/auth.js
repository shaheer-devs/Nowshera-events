const API_URL = "https://YOUR-RAILWAY-URL.up.railway.app";


// =========================
// SIGN UP
// =========================

const signupForm = document.getElementById("signupForm");

if (signupForm) {

    signupForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const fullName =
            document.getElementById("fullName").value;

        const email =
            document.getElementById("email").value;

        const password =
            document.getElementById("password").value;

        const message =
            document.getElementById("signupMessage");

        try {

            const response = await fetch(
                `${API_URL}/signup`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        full_name: fullName,
                        email: email,
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                message.textContent =
                    data.detail || "Signup failed.";

                return;
            }

            message.textContent =
                "Account created successfully! Redirecting to login...";

            setTimeout(function() {

                window.location.href = "login.html";

            }, 1500);

        } catch (error) {

            message.textContent =
                "Could not connect to the server.";

            console.error(error);
        }
    });
}



// =========================
// LOGIN
// =========================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value;

        const password =
            document.getElementById("loginPassword").value;

        const message =
            document.getElementById("loginMessage");

        try {

            const response = await fetch(
                `${API_URL}/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                message.textContent =
                    data.detail || "Login failed.";

                return;
            }


            // Save login information

            localStorage.setItem(
                "token",
                data.access_token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );


            message.textContent =
                "Login successful!";


            // Redirect according to user's role

            setTimeout(function() {

                if (data.user.role === "admin") {

                    window.location.href =
                        "admin/dashboard.html";

                } else {

                    window.location.href =
                        "events.html";
                }

            }, 800);


        } catch (error) {

            message.textContent =
                "Could not connect to the server.";

            console.error(error);
        }
    });
}



// =========================
// LOGOUT
// =========================

function logout() {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    window.location.href =
        "login.html";
}
