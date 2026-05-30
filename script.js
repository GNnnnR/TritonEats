document.addEventListener('DOMContentLoaded', () => {
  const ratingText = { 1: 'Poor', 2: 'Not great', 3: 'Okay', 4: 'Good', 5: 'Excellent' };

  function buildStarWidget(name, id) {
    const widget = document.createElement('div');
    widget.className = 'star-rating';

    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = name;
    hidden.id = id;
    widget.appendChild(hidden);

    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span');
      star.className = 'star';
      star.dataset.value = String(i);
      star.textContent = '★';
      star.setAttribute('role', 'button');
      star.setAttribute('tabindex', '0');
      widget.appendChild(star);
    }

    const feedback = document.createElement('span');
    feedback.className = 'star-rating-label';
    widget.appendChild(feedback);

    const stars = widget.querySelectorAll('.star');

    function setStars(hoverVal) {
      const selVal = hidden.value ? parseInt(hidden.value) : null;
      stars.forEach(s => {
        const v = parseInt(s.dataset.value);
        if (hoverVal !== null) {
          s.classList.toggle('hovered', v <= hoverVal);
          s.classList.remove('selected');
        } else {
          s.classList.remove('hovered');
          s.classList.toggle('selected', selVal !== null && v <= selVal);
        }
      });
    }

    stars.forEach(star => {
      star.addEventListener('mouseenter', () => {
        const val = parseInt(star.dataset.value);
        setStars(val);
        feedback.textContent = ratingText[val];
        feedback.style.color = '';
        feedback.classList.add('visible');
      });

      star.addEventListener('mouseleave', () => {
        setStars(null);
        const sel = hidden.value ? parseInt(hidden.value) : null;
        if (sel) {
          feedback.textContent = ratingText[sel];
          feedback.classList.add('visible');
        } else {
          feedback.classList.remove('visible');
        }
      });

      star.addEventListener('click', () => {
        const val = parseInt(star.dataset.value);
        hidden.value = String(val);
        setStars(null);
        feedback.textContent = ratingText[val];
        feedback.style.color = '';
        feedback.classList.add('visible');
      });

      star.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); star.click(); }
      });
    });

    return { widget, hidden, feedback, stars };
  }

  // ── RESTAURANT CARD RATINGS ───────────────────────────────────
  document.querySelectorAll('select[name$="-rating"]').forEach(select => {
    if (select.id === 'overall-rating') return;

    const prevEl = select.previousElementSibling;
    const nextEl = select.nextElementSibling;
    const label = prevEl?.tagName === 'LABEL' ? prevEl : null;
    const btn = nextEl?.tagName === 'BUTTON' ? nextEl : null;
    if (!btn) return;

    const { widget, hidden, feedback, stars } = buildStarWidget(select.name, select.id);

    // Reset submitted state when user picks a new star
    stars.forEach(star => star.addEventListener('click', () => {
      btn.textContent = 'Submit Rating';
      btn.classList.remove('submitted');
    }));

    btn.addEventListener('click', () => {
      if (!hidden.value) {
        feedback.textContent = 'Select a rating first';
        feedback.style.color = '#e53e3e';
        feedback.classList.add('visible');
        return;
      }
      btn.textContent = 'Saved ✓';
      btn.classList.add('submitted');
    });

    const row = document.createElement('div');
    row.className = 'rating-row';
    if (label) row.appendChild(label);
    row.appendChild(widget);
    row.appendChild(btn);

    select.parentNode.insertBefore(row, select);
    select.remove();
  });

  // ── CUSTOM DINING HALL SELECT ─────────────────────────────────
  const diningSelect = document.querySelector('#dining-hall-choice');
  if (diningSelect) {
    const opts = Array.from(diningSelect.options).slice(1);

    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    trigger.innerHTML = '<span class="cs-text">Choose a dining hall</span><span class="cs-arrow">▾</span>';

    const panel = document.createElement('div');
    panel.className = 'custom-select-options';

    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'dining-hall-choice';
    hidden.id = 'dining-hall-choice';

    opts.forEach(opt => {
      const div = document.createElement('div');
      div.className = 'custom-select-option';
      div.dataset.value = opt.value;
      div.textContent = opt.text;

      div.addEventListener('click', () => {
        hidden.value = opt.value;
        trigger.querySelector('.cs-text').textContent = opt.text;
        trigger.classList.add('has-value');
        panel.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
        div.classList.add('selected');
        wrapper.classList.remove('open');
      });

      panel.appendChild(div);
    });

    wrapper.appendChild(trigger);
    wrapper.appendChild(panel);
    wrapper.appendChild(hidden);
    diningSelect.replaceWith(wrapper);

    trigger.addEventListener('click', () => wrapper.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (!wrapper.contains(e.target)) wrapper.classList.remove('open');
    });
  }

  // ── FORM OVERALL RATING ───────────────────────────────────────
  const formSelect = document.querySelector('#overall-rating');
  if (formSelect) {
    const { widget, hidden, feedback } = buildStarWidget('overall-rating', 'overall-rating');
    widget.classList.add('form-star-rating');
    formSelect.replaceWith(widget);

    const form = document.querySelector('#ratings form');
    if (form) {
      form.addEventListener('submit', e => {
        if (!hidden.value) {
          e.preventDefault();
          feedback.textContent = 'Please select a rating';
          feedback.style.color = '#e53e3e';
          feedback.classList.add('visible');
          widget.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }
});

/* ── SUPABASE REVIEW DATABASE ─────────────────────────────── */

const SUPABASE_URL = "https://raaebhwnrtpxhnypjcdm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_sNFe12WNcDlUwMjCuCKy8A_R42Se_F9";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", () => {
  const ratingForm = document.getElementById("rating-form");
  const recentReviewsList = document.getElementById("recent-reviews-list");
  const topPicksList = document.getElementById("top-picks-list");
  const formMessage = document.getElementById("form-message");

  let allReviews = [];

  function escapeHTML(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function makeStars(rating) {
    const fullStars = "★".repeat(Number(rating));
    const emptyStars = "☆".repeat(5 - Number(rating));
    return fullStars + emptyStars;
  }

  async function loadReviews() {
    const { data, error } = await supabaseClient
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading reviews:", error);
      return;
    }

    allReviews = data || [];
    renderRecentReviews();
    renderTopFoods();
  }

  function renderRecentReviews() {
    if (!recentReviewsList) return;

    recentReviewsList.innerHTML = "";

    const latestTen = allReviews.slice(0, 10);

    if (latestTen.length === 0) {
      recentReviewsList.innerHTML = "<p>No reviews yet. Be the first to submit one!</p>";
      return;
    }

    latestTen.forEach(review => {
      const card = document.createElement("div");
      card.className = "review-card";

      card.innerHTML = `
        <h3>${escapeHTML(review.restaurant_name)}</h3>
        <p><strong>Dining Hall:</strong> ${escapeHTML(review.dining_hall)}</p>
        <p class="review-stars">${makeStars(review.rating)} ${review.rating}/5</p>
        <p>${escapeHTML(review.review_text)}</p>
        <p><em>By ${escapeHTML(review.student_name)}</em></p>
      `;

      recentReviewsList.appendChild(card);
    });
  }

  function renderTopFoods() {
    if (!topPicksList) return;

    topPicksList.innerHTML = "";

    const foodMap = {};

    allReviews.forEach(review => {
      const foodName = review.restaurant_name;

      if (!foodMap[foodName]) {
        foodMap[foodName] = {
          name: foodName,
          totalRating: 0,
          count: 0
        };
      }

      foodMap[foodName].totalRating += Number(review.rating);
      foodMap[foodName].count += 1;
    });

    const topFoods = Object.values(foodMap)
      .map(food => ({
        name: food.name,
        average: food.totalRating / food.count,
        count: food.count
      }))
      .sort((a, b) => {
        if (b.average === a.average) {
          return b.count - a.count;
        }
        return b.average - a.average;
      })
      .slice(0, 5);

    if (topFoods.length === 0) {
      topPicksList.innerHTML = `
        <div class="top-food-card">
          <h3>No ratings yet</h3>
          <p>Submit a review to generate the top rated food list.</p>
        </div>
      `;
      return;
    }

    topFoods.forEach((food, index) => {
      const card = document.createElement("div");
      card.className = "top-food-card";

      card.innerHTML = `
        <h3>#${index + 1} ${escapeHTML(food.name)}</h3>
        <p><strong>Average Rating:</strong> ${food.average.toFixed(1)} / 5</p>
        <p><strong>Total Reviews:</strong> ${food.count}</p>
      `;

      topPicksList.appendChild(card);
    });
  }

  if (ratingForm) {
    ratingForm.addEventListener("submit", async event => {
      event.preventDefault();

      const newReview = {
        student_name: document.getElementById("student-name").value.trim(),
        dining_hall: document.getElementById("dining-hall-choice").value,
        restaurant_name: document.getElementById("restaurant-name").value.trim(),
        rating: Number(document.getElementById("overall-rating").value),
        review_text: document.getElementById("review-text").value.trim()
      };

      if (
        !newReview.student_name ||
        !newReview.dining_hall ||
        !newReview.restaurant_name ||
        !newReview.rating ||
        !newReview.review_text
      ) {
        formMessage.textContent = "Please complete all fields before submitting.";
        formMessage.className = "error";
        return;
      }

      formMessage.textContent = "Submitting your review...";
      formMessage.className = "";

      const { error } = await supabaseClient
        .from("reviews")
        .insert([newReview]);

      if (error) {
        console.error("Error submitting review:", error);
        formMessage.textContent = "Something went wrong. Please try again.";
        formMessage.className = "error";
        return;
      }

      ratingForm.reset();

      formMessage.textContent = "Review submitted successfully!";
      formMessage.className = "success";
    });
  }

  supabaseClient
    .channel("reviews-realtime-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "reviews"
      },
      () => {
        loadReviews();
      }
    )
    .subscribe();

  loadReviews();
});