document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participants = details.participants || [];
        const participantsMarkup = participants.length
          ? `<div class="participants-section"><strong>Participants:</strong><ul class="participants-list">${participants
              .map((p) => `<li><span class="participant-email">${p}</span><button class="participant-remove" data-activity="${name}" data-email="${p}" aria-label="Remove participant">✖</button></li>`)
              .join("")}</ul></div>`
          : `<div class="participants-section"><strong>Participants:</strong><p class="participants-none">None yet</p></div>`;

        activityCard.dataset.max = details.max_participants;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsMarkup}
        `;

        // Hook up remove buttons
        // (use event listeners after element is in DOM)
        setTimeout(() => {
          activityCard.querySelectorAll('.participant-remove').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
              const email = btn.dataset.email;
              const activity = btn.dataset.activity;
              try {
                const resp = await fetch(`/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
                const resJson = await resp.json();
                if (resp.ok) {
                  const li = btn.closest('li');
                  if (li) li.remove();

                  const ul = activityCard.querySelector('.participants-list');
                  if (!ul || ul.children.length === 0) {
                    const section = activityCard.querySelector('.participants-section');
                    if (section) section.innerHTML = `<strong>Participants:</strong><p class="participants-none">None yet</p>`;
                  }

                  // Update availability
                  const availabilityP = activityCard.querySelector('.availability');
                  const maxParticipants = parseInt(activityCard.dataset.max, 10) || 0;
                  const currentCount = activityCard.querySelectorAll('.participants-list li').length;
                  const remaining = maxParticipants - currentCount;
                  if (availabilityP) availabilityP.innerHTML = `<strong>Availability:</strong> ${remaining} spots left`;

                  messageDiv.textContent = resJson.message || 'Participant removed';
                  messageDiv.className = 'success';
                } else {
                  messageDiv.textContent = resJson.detail || 'Failed to remove participant';
                  messageDiv.className = 'error';
                }
              } catch (err) {
                console.error('Error removing participant:', err);
                messageDiv.textContent = 'Failed to remove participant. Please try again.';
                messageDiv.className = 'error';
              }
              messageDiv.classList.remove('hidden');
              setTimeout(() => messageDiv.classList.add('hidden'), 5000);
            });
          });
        }, 0);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Update activity card in the DOM so user sees the new participant immediately
        const cards = activitiesList.querySelectorAll('.activity-card');
        const card = Array.from(cards).find(c => {
          const h = c.querySelector('h4');
          return h && h.textContent.trim() === activity;
        });

        if (card) {
          // Ensure participants list exists
          let participantsSection = card.querySelector('.participants-section');
          if (!participantsSection) {
            participantsSection = document.createElement('div');
            participantsSection.className = 'participants-section';
            card.appendChild(participantsSection);
          }

          let ul = card.querySelector('.participants-list');
          if (!ul) {
            participantsSection.innerHTML = `<strong>Participants:</strong><ul class="participants-list"></ul>`;
            ul = participantsSection.querySelector('.participants-list');
          }

          // Create new participant list item with remove button
          const li = document.createElement('li');
          const span = document.createElement('span');
          span.className = 'participant-email';
          span.textContent = email;
          const btn = document.createElement('button');
          btn.className = 'participant-remove';
          btn.dataset.activity = activity;
          btn.dataset.email = email;
          btn.setAttribute('aria-label', 'Remove participant');
          btn.textContent = '✖';

          li.appendChild(span);
          li.appendChild(btn);
          ul.appendChild(li);

          // Attach remove handler (same logic as existing remove handlers)
          btn.addEventListener('click', async () => {
            try {
              const resp = await fetch(`/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
              const resJson = await resp.json();
              if (resp.ok) {
                li.remove();

                // If no participants left, show placeholder
                const remainingItems = card.querySelectorAll('.participants-list li').length;
                if (remainingItems === 0) {
                  const section = card.querySelector('.participants-section');
                  if (section) section.innerHTML = `<strong>Participants:</strong><p class="participants-none">None yet</p>`;
                }

                // Update availability
                const availabilityP = card.querySelector('.availability');
                const maxParticipants = parseInt(card.dataset.max, 10) || 0;
                const currentCount = card.querySelectorAll('.participants-list li').length;
                const remaining = maxParticipants - currentCount;
                if (availabilityP) availabilityP.innerHTML = `<strong>Availability:</strong> ${remaining} spots left`;

                messageDiv.textContent = resJson.message || 'Participant removed';
                messageDiv.className = 'success';
              } else {
                messageDiv.textContent = resJson.detail || 'Failed to remove participant';
                messageDiv.className = 'error';
              }
            } catch (err) {
              console.error('Error removing participant:', err);
              messageDiv.textContent = 'Failed to remove participant. Please try again.';
              messageDiv.className = 'error';
            }
            messageDiv.classList.remove('hidden');
            setTimeout(() => messageDiv.classList.add('hidden'), 5000);
          });

          // Update availability after signup
          const availabilityP = card.querySelector('.availability');
          const maxParticipants = parseInt(card.dataset.max, 10) || 0;
          const currentCount = card.querySelectorAll('.participants-list li').length;
          const remaining = maxParticipants - currentCount;
          if (availabilityP) availabilityP.innerHTML = `<strong>Availability:</strong> ${remaining} spots left`;
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
