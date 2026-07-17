const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000`;

let token = localStorage.getItem("mhn_test_token");

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function setMessage(text, isError = false) {
  const message = $("#message");
  message.textContent = text || "";
  message.className = isError ? "bad" : "ok";
}

function setStatus(selector, text, ok) {
  const element = $(selector);
  element.textContent = text;
  element.className = ok ? "ok" : "bad";
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;

  if (options.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Request failed with ${response.status}`);
  }

  return payload.data ?? payload;
}

function saveToken(nextToken) {
  token = nextToken;
  localStorage.setItem("mhn_test_token", nextToken);
}

function clearToken() {
  token = null;
  localStorage.removeItem("mhn_test_token");
}

function showGuest() {
  $("#authCard").classList.remove("hidden");
  $("#customerCard").classList.add("hidden");
  $("#customerJson").textContent = "";
  $("#bookingsJson").textContent = "";
  setStatus("#sessionStatus", "not logged in", false);
}

async function showCustomer(customer) {
  $("#authCard").classList.add("hidden");
  $("#customerCard").classList.remove("hidden");
  $("#customerJson").textContent = JSON.stringify(customer, null, 2);
  setStatus("#sessionStatus", `logged in as ${customer.email}`, true);
  await loadBookings();
}

async function checkBackend() {
  try {
    const data = await api("/health");
    setStatus("#backendStatus", data.message || "connected", true);
  } catch (error) {
    setStatus("#backendStatus", error.message, false);
  }
}

async function checkOAuthProviders() {
  try {
    const status = await api("/api/auth/status");
    const providers = status.oauthProviders;
    const configured = providers
      .filter((provider) => provider.configured)
      .map((provider) => provider.provider);
    const missing = providers
      .filter((provider) => !provider.configured)
      .map((provider) => provider.provider);

    if (status.databaseReady) {
      setStatus("#databaseStatus", "customer auth tables ready", true);
    } else {
      setStatus("#databaseStatus", `missing ${status.missingTables.join(", ")}`, false);
    }

    providers.forEach((provider) => {
      const button = $(`[data-oauth-start="${provider.provider}"]`);
      if (!button) return;

      button.disabled = !provider.configured;
      button.title = provider.configured
        ? `Login with ${provider.provider}`
        : `${provider.provider.toUpperCase()} credentials are missing from Backend/.env`;
    });

    if (missing.length) {
      const configuredText = configured.length ? `configured: ${configured.join(", ")}` : "no providers configured";
      setStatus("#oauthStatus", `${configuredText}; missing: ${missing.join(", ")}`, configured.length > 0);
      return;
    }

    setStatus("#oauthStatus", "all providers configured", true);
  } catch (error) {
    setStatus("#oauthStatus", error.message, false);
  }
}

async function refreshMe() {
  if (!token) {
    showGuest();
    return;
  }

  try {
    const customer = await api("/api/auth/me");
    await showCustomer(customer);
  } catch (error) {
    clearToken();
    showGuest();
    setMessage(error.message, true);
  }
}

async function loadBookings() {
  const bookings = await api("/api/customer/bookings");
  $("#bookingsJson").textContent = JSON.stringify(bookings, null, 2);
}

function handleOAuthReturn() {
  const url = new URL(window.location.href);
  const oauthToken = url.searchParams.get("oauthToken");
  const oauthError = url.searchParams.get("oauthError");

  if (oauthToken) {
    saveToken(oauthToken);
    url.searchParams.delete("oauthToken");
    window.history.replaceState({}, "", url.toString());
    setMessage("OAuth login successful.");
  }

  if (oauthError) {
    url.searchParams.delete("oauthError");
    window.history.replaceState({}, "", url.toString());
    setMessage(oauthError, true);
  }
}

function bindEvents() {
  $("#showEmailBtn").addEventListener("click", () => {
    $("#emailForms").classList.toggle("hidden");
  });

  $$(".mode").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".mode").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      $("#loginForm").classList.toggle("active-form", button.dataset.mode === "login");
      $("#registerForm").classList.toggle("active-form", button.dataset.mode === "signup");
    });
  });

  $$("[data-oauth-start]").forEach((button) => {
    button.addEventListener("click", () => {
      const returnTo = encodeURIComponent(window.location.origin + window.location.pathname);
      window.location.href = `${API_BASE_URL}/api/auth/oauth/${button.dataset.oauthStart}/start?returnTo=${returnTo}`;
    });
  });

  $$("[data-oauth-mock]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const data = await api(`/api/auth/oauth/${button.dataset.oauthMock}/mock`, { method: "POST" });
        saveToken(data.token);
        setMessage(`Mock ${button.dataset.oauthMock} login successful.`);
        await refreshMe();
      } catch (error) {
        setMessage(error.message, true);
      }
    });
  });

  $("#registerForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const data = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(formData(event.currentTarget))
      });
      saveToken(data.token);
      setMessage("Signup successful.");
      await refreshMe();
    } catch (error) {
      setMessage(error.message, true);
    }
  });

  $("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(formData(event.currentTarget))
      });
      saveToken(data.token);
      setMessage("Login successful.");
      await refreshMe();
    } catch (error) {
      setMessage(error.message, true);
    }
  });

  $("#bookingForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const values = formData(event.currentTarget);
      await api("/api/customer/bookings", {
        method: "POST",
        body: JSON.stringify({
          amount: values.amount,
          bookingDate: values.bookingDate,
          passengerCount: values.passengerCount,
          notes: values.tourName
        })
      });
      setMessage("Booking created.");
      await loadBookings();
      await refreshMe();
    } catch (error) {
      setMessage(error.message, true);
    }
  });

  $("#logoutBtn").addEventListener("click", () => {
    clearToken();
    showGuest();
    setMessage("Logged out.");
  });
}

handleOAuthReturn();
bindEvents();
checkBackend();
checkOAuthProviders();
refreshMe();
