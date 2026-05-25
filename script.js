const API_BASE = window.__SITE_CONFIG__?.API_BASE || window.API_BASE || 'https://rocktest.onrender.com';
const STORIES_API_URL = `${API_BASE}/api/stories`;
const FALLBACK_IMAGE = `${API_BASE}/api/images/placeholder.svg`;
const FALLBACK_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin';

let storiesPromise = null;
const CATEGORY_PAGE_BATCH_SIZE = 6;
let categoryPageState = {
  stories: [],
  visibleCount: CATEGORY_PAGE_BATCH_SIZE,
  label: '',
  isLoading: false,
};

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;

  const mobileTrigger = document.getElementById('mobile-drawer-trigger');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const drawerOverlay = document.getElementById('mobile-drawer-overlay');
  const drawerClose = document.querySelector('.drawer-close-btn');

  function openDrawer() {
    if (mobileDrawer) {
      mobileDrawer.classList.add('open');
      mobileDrawer.setAttribute('aria-hidden', 'false');
    }
    if (drawerOverlay) {
      drawerOverlay.classList.add('visible');
      drawerOverlay.setAttribute('aria-hidden', 'false');
    }
    if (mobileTrigger) {
      mobileTrigger.setAttribute('aria-expanded', 'true');
    }
    body.classList.add('drawer-open');
  }

  function closeDrawer() {
    if (mobileDrawer) {
      mobileDrawer.classList.remove('open');
      mobileDrawer.setAttribute('aria-hidden', 'true');
    }
    if (drawerOverlay) {
      drawerOverlay.classList.remove('visible');
      drawerOverlay.setAttribute('aria-hidden', 'true');
    }
    if (mobileTrigger) {
      mobileTrigger.setAttribute('aria-expanded', 'false');
    }
    body.classList.remove('drawer-open');
  }

  if (mobileTrigger) {
    mobileTrigger.addEventListener('click', () => {
      const expanded = mobileTrigger.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
  }

  if (drawerClose) {
    drawerClose.addEventListener('click', closeDrawer);
  }

  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeDrawer);
  }

  document.querySelectorAll('.megamenu-trigger').forEach((btn) => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';

      document.querySelectorAll('.megamenu-trigger').forEach((otherBtn) => {
        if (otherBtn !== btn) {
          otherBtn.setAttribute('aria-expanded', 'false');
          const dropdown = otherBtn.nextElementSibling;
          if (dropdown) {
            dropdown.setAttribute('aria-hidden', 'true');
          }
        }
      });

      btn.setAttribute('aria-expanded', String(!expanded));
      const dropdown = btn.nextElementSibling;
      if (dropdown) {
        dropdown.setAttribute('aria-hidden', String(expanded));
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeDrawer();
      document.querySelectorAll('.megamenu-trigger').forEach((btn) => {
        btn.setAttribute('aria-expanded', 'false');
        const dropdown = btn.nextElementSibling;
        if (dropdown) {
          dropdown.setAttribute('aria-hidden', 'true');
        }
      });
    }
  });

  const carouselTrack = document.getElementById('carousel-track');
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');

  if (carouselTrack && prevBtn && nextBtn) {
    const getScrollStep = () => carouselTrack.clientWidth;
    prevBtn.addEventListener('click', () => {
      carouselTrack.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', () => {
      carouselTrack.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
    });
  }

  hydrateStoriesFromApi().catch((error) => {
    console.error('Failed to hydrate stories from API', error);
  });

  document.addEventListener('click', async (event) => {
    const filterLink = event.target.closest('.entry-meta-taxonomies a');

    if (!filterLink) {
      return;
    }

    const label = filterLink.textContent.trim();
    event.preventDefault();
    event.stopPropagation();

    const normalizedLabel = label.toLowerCase();
    const supportedLabels = new Set(['news', 'reviews', 'nollywood']);

    if (!supportedLabels.has(normalizedLabel)) {
      return;
    }

    const stories = (await fetchStories()).map(normalizeStory);
    const filteredStories = getMegamenuStoriesByLabel(
      label,
      stories,
      stories.length
    );

    if (window.location.pathname && window.location.pathname.endsWith('category.html')) {
      renderCategoryStoriesPage(label, filteredStories);
    } else {
      renderFilteredStories(filteredStories);
    }

    const params = new URLSearchParams(window.location.search);
    params.set('label', label);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    history.pushState({}, '', nextUrl);
  });

  // Add click handlers for megamenu nav-links to filter and render label-specific story sets
  document.querySelectorAll('.megamenu-sidebar-links a').forEach((link) => {
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const categoryLabel = link.textContent.trim();
      const stories = await fetchStories();
      const normalizedStories = stories.map(normalizeStory);

      const filteredStories = getMegamenuStoriesByLabel(
        categoryLabel,
        normalizedStories,
        document.querySelectorAll('.mega-card').length || 4
      );

      setActiveMegamenuLink(link);
      renderMegamenuStories(filteredStories);

      const megamenuTrigger = document.querySelector('.megamenu-trigger');
      if (megamenuTrigger) {
        megamenuTrigger.setAttribute('aria-expanded', 'false');
      }
      const megamenuDropdown = document.getElementById('desktop-megamenu');
      if (megamenuDropdown) {
        megamenuDropdown.setAttribute('aria-hidden', 'true');
      }
    });
  });
});

function fetchStories() {
  if (!storiesPromise) {
    storiesPromise = fetch(STORIES_API_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Stories API request failed with ${response.status}`);
        }
        return response.json();
      })
      .then((payload) => (Array.isArray(payload) ? payload : []))
      .catch((error) => {
        console.error('Stories API fetch failed', error);
        return [];
      });
  }

  return storiesPromise;
}

function normalizeStory(story) {
  const parsedTags = parseTags(story.tags);
  const normalizedTags = [story.category, ...parsedTags].filter(Boolean);

  return {
    id: story.id || '',
    slug: story.slug || '',
    headline: story.headline || 'Untitled story',
    excerpt: story.excerpt || '',
    body: story.body || '',
    imageUrl: story.image_url || FALLBACK_IMAGE,
    metaDescription: story.meta_description || story.excerpt || '',
    category: story.category || 'general',
    createdAt: story.created_at || '',
    qualityScore: story.quality_score,
    tags: normalizedTags,
  };
}

function parseTags(tags) {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags.flatMap((tag) => parseTags(tag));
  }

  const raw = String(tags)
    .replace(/^\[|\]$/g, '')
    .replace(/['"]/g, '');

  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatStoryDate(dateValue) {
  if (!dateValue) {
    return '';
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function buildStoryUrl(story) {
  if (!story || !story.slug) {
    return 'single.html';
  }

  return `single.html?slug=${encodeURIComponent(story.slug)}`;
}

function getStorySnippet(story) {
  const source = story.excerpt || story.body || '';
  const compact = source.replace(/\s+/g, ' ').trim();
  if (!compact) {
    return 'Read the full story.';
  }

  return compact.length > 160 ? `${compact.slice(0, 160).trim()}...` : compact;
}

function buildMetricsMarkup(commentText = '0 Comment', viewText = '0 Views') {
  return `
    <span><img class="metric-icon" src="assets/img/bxs chat.svg" alt="" aria-hidden="true"> ${escapeHtml(commentText)}</span>
    <span><img class="metric-icon" src="assets/img/view.svg" alt="" aria-hidden="true"> ${escapeHtml(viewText)}</span>
  `;
}

function getMegamenuStoriesByLabel(label, stories, limit) {
  const normalizedLabel = String(label || '').trim().toLowerCase();
  const keywordMap = {
    news: ['news', 'breaking', 'update', 'headline'],
    reviews: ['review', 'reviews', 'critique', 'analysis'],
    nollywood: ['nollywood', 'nigerian film', 'african cinema', 'film', 'movie'],
  };

  const keywords = keywordMap[normalizedLabel] || [normalizedLabel];
  const matchedStories = stories.filter((story) => {
    const haystack = [
      story.headline,
      story.excerpt,
      story.body,
      story.category,
      ...(story.tags || []),
    ]
      .join(' ')
      .toLowerCase();

    return keywords.some((keyword) => keyword && haystack.includes(keyword));
  });

  if (matchedStories.length >= limit) {
    return matchedStories.slice(0, limit);
  }

  if (matchedStories.length > 0) {
    return matchedStories;
  }

  const fallbackOffsets = {
    news: 0,
    reviews: limit,
    nollywood: limit * 2,
  };

  const fallbackStart = fallbackOffsets[normalizedLabel] ?? 0;
  return stories.slice(fallbackStart, fallbackStart + limit);
}

function setActiveMegamenuLink(activeLink) {
  document.querySelectorAll('.megamenu-sidebar-links a').forEach((link) => {
    link.classList.toggle('is-active', link === activeLink);
  });
}

async function hydrateStoriesFromApi() {
  const storyList = (await fetchStories()).map(normalizeStory);
  if (!storyList.length) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const label = params.get('label');
  const categoryStoriesContainer = document.getElementById('category-stories');

  if (categoryStoriesContainer) {
    const normalizedStories = storyList;
    const filtered = label
      ? getMegamenuStoriesByLabel(label, normalizedStories, normalizedStories.length)
      : normalizedStories;
    renderCategoryStoriesPage(label || 'Stories', filtered);
    return;
  }

  renderHomepageStories(storyList);
  renderSingleStoryPage(storyList);
}

function renderHomepageStories(stories) {
  const carouselSlides = Array.from(document.querySelectorAll('.carousel-slide'));
  const feedCards = Array.from(document.querySelectorAll('.feed-card'));
  const miniPostItems = Array.from(document.querySelectorAll('.mini-post-item'));
  const featuredSidebarCard = document.querySelector('.featured-sidebar-card');
  const featuredSidebarLink = document.querySelector('.featured-card-link');
  const featuredSidebarImage = document.querySelector('.featured-card-thumb img');
  const featuredSidebarTitle = document.querySelector('.featured-card-title');
  const featuredSidebarAuthor = document.querySelector('.featured-card-meta .author');
  const featuredSidebarTime = document.querySelector('.featured-card-meta time');
  const trendingCategoryItems = Array.from(document.querySelectorAll('.trending-category-item'));
  const megaCards = Array.from(document.querySelectorAll('.mega-card'));

  const carouselStories = stories.slice(0, carouselSlides.length);
  const feedStartIndex = carouselSlides.length;
  const feedStories = stories.slice(feedStartIndex, feedStartIndex + feedCards.length);
  const sidebarStartIndex = feedStartIndex + feedCards.length;
  const miniStories = stories.slice(sidebarStartIndex, sidebarStartIndex + miniPostItems.length);
  const featuredStory = stories[sidebarStartIndex + miniPostItems.length] || stories[0];
  const trendingStories = getTrendingStories(stories, trendingCategoryItems.length);
  const megamenuStories = stories.slice(0, megaCards.length);

  carouselStories.forEach((story, index) => {
    const slide = carouselSlides[index];
    if (!slide) {
      return;
    }

    if (!story) {
      slide.hidden = true;
      return;
    }

    slide.hidden = false;
    const link = slide.querySelector('.slide-inner-link');
    const image = slide.querySelector('img');
    const title = slide.querySelector('.slide-title');

    if (link) {
      link.href = buildStoryUrl(story);
    }
    if (image) {
      image.src = story.imageUrl;
      image.alt = story.headline;
    }
    if (title) {
      title.textContent = story.headline;
    }
  });

  feedCards.forEach((card, index) => {
    const story = feedStories[index] || stories[index];
    if (!story) {
      card.hidden = true;
      return;
    }

    card.hidden = false;
    const thumbLink = card.querySelector('.article-thumb-link');
    const image = card.querySelector('.feed-thumb-wrap img');
    const taxonomy = card.querySelector('.entry-meta-taxonomies');
    const titleLink = card.querySelector('.entry-title a');
    const author = card.querySelector('.author');
    const time = card.querySelector('time');
    const summary = card.querySelector('.entry-summary p');
    const readMore = card.querySelector('.read-more');

    if (thumbLink) {
      thumbLink.href = buildStoryUrl(story);
    }
    if (image) {
      image.src = story.imageUrl;
      image.alt = story.headline;
    }
    if (taxonomy) {
      taxonomy.innerHTML = `<span itemprop="keywords">${story.tags.slice(0, 3).map((tag) => `<a href="#">${escapeHtml(tag.toUpperCase())}</a>`).join(', ')}</span>`;
    }
    if (titleLink) {
      titleLink.href = buildStoryUrl(story);
      titleLink.textContent = story.headline;
    }
    if (author) {
      author.textContent = 'By admin';
    }
    if (time) {
      time.dateTime = story.createdAt || '';
      time.textContent = formatStoryDate(story.createdAt);
    }
    if (summary) {
      summary.textContent = getStorySnippet(story);
    }
    if (readMore) {
      readMore.href = buildStoryUrl(story);
    }
    const metrics = card.querySelector('.metrics');
    if (metrics) {
      metrics.innerHTML = buildMetricsMarkup('0 Comment', '51 Views');
    }
  });

  window.requestAnimationFrame(() => {
    megaCards.forEach((card, index) => {
      const story = megamenuStories[index] || stories[index];
      if (!story) {
        card.hidden = true;
        return;
      }

      card.hidden = false;
      const cardLink = card.querySelector('.mega-card-link');
      const image = card.querySelector('img');
      const title = card.querySelector('h3');
      const date = card.querySelector('.mega-date');

      if (cardLink) {
        cardLink.href = buildStoryUrl(story);
      }
      if (image) {
        image.src = story.imageUrl;
        image.alt = story.headline;
      }
      if (title) {
        title.textContent = story.headline;
      }
      if (date) {
        date.textContent = `admin • ${formatStoryDate(story.createdAt)}`;
      }
    });

    miniPostItems.forEach((item, index) => {
      const story = miniStories[index] || stories[index];
      if (!story) {
        item.hidden = true;
        return;
      }

      item.hidden = false;
      const imageLink = item.querySelector('.mini-post-image-link');
      const image = item.querySelector('img');
      const titleLink = item.querySelector('.mini-post-meta h4 a');
      const date = item.querySelector('.mini-post-meta .date');

      if (imageLink) {
        imageLink.href = buildStoryUrl(story);
      }
      if (image) {
        image.src = story.imageUrl;
        image.alt = story.headline;
      }
      if (titleLink) {
        titleLink.href = buildStoryUrl(story);
        titleLink.textContent = story.headline;
      }
      if (date) {
        date.textContent = formatStoryDate(story.createdAt);
      }
    });

    if (featuredSidebarCard && featuredSidebarLink && featuredSidebarImage && featuredSidebarTitle) {
      if (featuredStory) {
        featuredSidebarCard.hidden = false;
        featuredSidebarLink.href = buildStoryUrl(featuredStory);
        featuredSidebarImage.src = featuredStory.imageUrl;
        featuredSidebarImage.alt = featuredStory.headline;
        featuredSidebarTitle.textContent = featuredStory.headline;

        if (featuredSidebarAuthor) {
          featuredSidebarAuthor.textContent = 'admin';
        }

        if (featuredSidebarTime) {
          featuredSidebarTime.dateTime = featuredStory.createdAt || '';
          featuredSidebarTime.textContent = formatStoryDate(featuredStory.createdAt);
        }
      } else {
        featuredSidebarCard.hidden = true;
      }
    }

    renderTrendingCategories(trendingCategoryItems, trendingStories);
  });
}

function getTrendingStories(stories, limit) {
  // Prefer one story per unique category, but if there aren't enough unique
  // categories, fill remaining slots by cycling through available stories so
  // the UI always has `limit` items to render.
  if (!Array.isArray(stories) || stories.length === 0) {
    return [];
  }

  const uniqueStories = [];
  const seenCategories = new Set();

  // First pass: collect one story per unique category
  for (const story of stories) {
    const categoryKey = String(story.category || '').trim().toLowerCase();
    if (!categoryKey) continue;
    if (!seenCategories.has(categoryKey)) {
      seenCategories.add(categoryKey);
      uniqueStories.push(story);
      if (uniqueStories.length >= limit) break;
    }
  }

  // If we don't have enough unique categories, fill the rest by cycling
  // through the full stories list (preserves order) until we reach `limit`.
  let i = 0;
  while (uniqueStories.length < limit && stories.length > 0) {
    uniqueStories.push(stories[i % stories.length]);
    i += 1;
  }

  return uniqueStories.slice(0, limit);
}

function renderTrendingCategories(categoryItems, stories) {
  categoryItems.forEach((item, index) => {
    const story = stories[index];
    const bannerImg = item.querySelector('.category-banner-img');
    const bgLayer = item.querySelector('.category-bg-layer');
    const categoryName = item.querySelector('.category-name');

    if (!story) {
      item.hidden = true;
      return;
    }

    item.hidden = false;
    item.href = buildStoryUrl(story);
    item.setAttribute('aria-label', `Explore ${story.category} trending stories`);

    if (bannerImg) {
      // Determine a theme query based on the static badge text (keeps images relevant to the label)
      const badgeText = (categoryName && categoryName.textContent) ? categoryName.textContent.trim().toLowerCase() : (story.category || 'general');
      let themeQuery = '';

      if (badgeText.includes('movie') || badgeText.includes('movies')) themeQuery = 'film,cinema,editor';
      else if (badgeText.includes('news')) themeQuery = 'newsroom,journalist,reporter';
      else if (badgeText.includes('nollywood') || badgeText.includes('nolly')) themeQuery = 'africa,film,actors';
      else themeQuery = 'creative,studio,media';

      // Prefer a themed Unsplash image; immediate inline image shows while the background loads.
      const themedImage = `https://source.unsplash.com/900x600/?${encodeURIComponent(themeQuery)}`;
      bannerImg.src = themedImage;
      bannerImg.alt = `${categoryName ? categoryName.textContent.trim() : (story.category || 'General')} trending story`;
    }

    if (bgLayer) {
      // Try the themed image first (keeps visuals aligned with the badge text).
      const themeQuery = (categoryName && categoryName.textContent) ? categoryName.textContent.trim().toLowerCase() : (story.category || 'general');
      const themedImage = `https://source.unsplash.com/900x600/?${encodeURIComponent(themeQuery)}`;
      const imageToLoad = story.imageUrl || themedImage || FALLBACK_IMAGE;
      const loader = new Image();
      loader.onload = () => {
        bgLayer.style.backgroundImage = `url('${imageToLoad}')`;
        bgLayer.style.backgroundSize = 'cover';
        bgLayer.style.backgroundPosition = 'center';
        bgLayer.classList.add('has-bg');
        if (bannerImg) {
          bannerImg.style.display = 'none';
        }
      };
      loader.onerror = () => {
        // fall back to the configured fallback image
        bgLayer.style.backgroundImage = `url('${FALLBACK_IMAGE}')`;
        bgLayer.style.backgroundSize = 'cover';
        bgLayer.style.backgroundPosition = 'center';
        if (bannerImg) {
          bannerImg.src = FALLBACK_IMAGE;
        }
      };
      loader.src = imageToLoad;
    }

    if (categoryName) {
      // Don't overwrite the static category labels in the markup.
      // Only set the text if the element is empty.
      if (!categoryName.textContent || !categoryName.textContent.trim()) {
        categoryName.textContent = (story.category || 'General').replace(/\b\w/g, (character) => character.toUpperCase());
      }
    }
  });
}

function renderSingleStoryPage(stories) {
  const entry = document.querySelector('.single-article-entry');
  if (!entry) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const requestedSlug = params.get('slug');
  const story = stories.find((item) => item.slug === requestedSlug) || stories[0];

  if (!story) {
    return;
  }

  document.title = story.headline;
  updateMetaTag('description', story.metaDescription || getStorySnippet(story));
  updateMetaTag('og:title', story.headline, 'property', 'og:title');
  updateMetaTag('og:description', story.metaDescription || getStorySnippet(story), 'property', 'og:description');
  updateMetaTag('og:image', story.imageUrl, 'property', 'og:image');

  const taxonomies = entry.querySelector('.article-taxonomies');
  if (taxonomies) {
    const taxonomyLabels = story.tags.length ? story.tags : [story.category];
    taxonomies.innerHTML = `<span itemprop="keywords">${taxonomyLabels.map((tag) => `<a href="#">${escapeHtml(tag.toUpperCase())}</a>`).join(' ')}</span>`;
  }

  const title = entry.querySelector('.article-primary-title');
  if (title) {
    title.textContent = story.headline;
  }

  const avatar = entry.querySelector('.author-avatar');
  const authorName = entry.querySelector('.author-name');
  const time = entry.querySelector('.article-author-meta time');
  if (avatar) {
    avatar.src = FALLBACK_AVATAR;
    avatar.alt = 'Avatar for admin';
  }
  if (authorName) {
    authorName.textContent = 'admin';
  }
  if (time) {
    time.dateTime = story.createdAt || '';
    time.textContent = formatStoryDate(story.createdAt);
  }

  const featuredImage = entry.querySelector('.article-featured-media img');
  if (featuredImage) {
    featuredImage.src = story.imageUrl;
    featuredImage.alt = story.headline;
  }

  const bodyContent = entry.querySelector('.article-body-content');
  if (bodyContent) {
    bodyContent.innerHTML = '';
    bodyContent.appendChild(buildArticleBody(story));
  }

  const previousLink = entry.querySelector('.node-link');
  if (previousLink) {
    previousLink.href = 'index.html';
    previousLink.textContent = stories[1]?.headline || 'Back to homepage';
  }
}

function buildArticleBody(story) {
  const fragment = document.createDocumentFragment();
  const excerpt = story.excerpt || getStorySnippet(story);
  const bodyText = story.body || '';
  const blocks = bodyText
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (excerpt) {
    const lead = document.createElement('p');
    lead.className = 'lead-text';
    lead.textContent = excerpt;
    fragment.appendChild(lead);
  }

  blocks.forEach((block) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    const listItems = lines.filter((line) => /^(?:\d+\)|[-*])\s+/.test(line));

    if (listItems.length >= 2) {
      const list = document.createElement('ul');
      list.className = 'styled-narrative-list';
      listItems.forEach((itemText) => {
        const item = document.createElement('li');
        item.innerHTML = formatInlineText(itemText.replace(/^(?:\d+\)|[-*])\s+/, ''));
        list.appendChild(item);
      });
      fragment.appendChild(list);
      return;
    }

    if (/^##\s+/.test(lines[0] || '')) {
      const heading = document.createElement('h2');
      heading.textContent = lines[0].replace(/^##\s+/, '');
      fragment.appendChild(heading);
      return;
    }

    const paragraph = document.createElement('p');
    paragraph.innerHTML = formatInlineText(lines.join(' '));
    fragment.appendChild(paragraph);
  });

  if (!blocks.length) {
    const paragraph = document.createElement('p');
    paragraph.textContent = story.body || story.excerpt || 'Story content will appear here.';
    fragment.appendChild(paragraph);
  }

  return fragment;
}

function updateMetaTag(name, content, attributeName = 'name', attributeValue = name) {
  const selector = attributeName === 'property' ? `meta[property="${attributeValue}"]` : `meta[name="${attributeValue}"]`;
  let tag = document.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attributeName, attributeValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function formatInlineText(text) {
  return escapeHtml(String(text))
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderFilteredStories(filteredStories) {
  const feedCards = Array.from(document.querySelectorAll('.feed-card'));

  feedCards.forEach((card, index) => {
    const story = filteredStories[index];
    if (!story) {
      card.hidden = true;
      return;
    }

    card.hidden = false;
    const thumbLink = card.querySelector('.article-thumb-link');
    const image = card.querySelector('.feed-thumb-wrap img');
    const taxonomy = card.querySelector('.entry-meta-taxonomies');
    const titleLink = card.querySelector('.entry-title a');
    const author = card.querySelector('.author');
    const time = card.querySelector('time');
    const summary = card.querySelector('.entry-summary p');
    const readMore = card.querySelector('.read-more');

    if (thumbLink) {
      thumbLink.href = buildStoryUrl(story);
    }
    if (image) {
      image.src = story.imageUrl;
      image.alt = story.headline;
    }
    if (taxonomy) {
      taxonomy.innerHTML = `<span itemprop="keywords">${story.tags.slice(0, 3).map((tag) => `<a href="#">${escapeHtml(tag.toUpperCase())}</a>`).join(', ')}</span>`;
    }
    if (titleLink) {
      titleLink.href = buildStoryUrl(story);
      titleLink.textContent = story.headline;
    }
    if (author) {
      author.textContent = 'By admin';
    }
    if (time) {
      time.dateTime = story.createdAt || '';
      time.textContent = formatStoryDate(story.createdAt);
    }
    if (summary) {
      summary.textContent = getStorySnippet(story);
    }
    if (readMore) {
      readMore.href = buildStoryUrl(story);
    }
    const metrics = card.querySelector('.metrics');
    if (metrics) {
      metrics.innerHTML = buildMetricsMarkup('0 Comment', '51 Views');
    }
  });

  // Scroll to feed section to show the filtered results
  const feedSection = document.querySelector('.feed-container') || document.querySelector('.main-feed');
  if (feedSection) {
    feedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderCategoryStoriesPage(label, stories) {
  const storiesContainer = document.getElementById('category-stories');
  const loadMoreButton = document.getElementById('category-load-more');
  categoryPageState = {
    stories: Array.isArray(stories) ? stories : [],
    visibleCount: CATEGORY_PAGE_BATCH_SIZE,
    label: String(label || '').trim(),
    isLoading: false,
  };

  if (!storiesContainer) {
    return;
  }

  storiesContainer.innerHTML = '';
  appendCategoryStories(storiesContainer, categoryPageState.stories.slice(0, categoryPageState.visibleCount));
  syncCategoryLoadMoreButton(loadMoreButton);

  if (loadMoreButton) {
    loadMoreButton.onclick = async () => {
      if (categoryPageState.isLoading) {
        return;
      }

      categoryPageState.isLoading = true;
      syncCategoryLoadMoreButton(loadMoreButton);

      await new Promise((resolve) => window.requestAnimationFrame(resolve));

      const nextVisibleCount = Math.min(
        categoryPageState.visibleCount + CATEGORY_PAGE_BATCH_SIZE,
        categoryPageState.stories.length
      );
      const nextBatch = categoryPageState.stories.slice(categoryPageState.visibleCount, nextVisibleCount);
      appendCategoryStories(storiesContainer, nextBatch);
      categoryPageState.visibleCount = nextVisibleCount;
      categoryPageState.isLoading = false;
      syncCategoryLoadMoreButton(loadMoreButton);
    };
  }
}

function appendCategoryStories(container, stories) {
  stories.forEach((story) => {
    const card = createStoryCard(story);
    if (card) {
      container.appendChild(card);
    }
  });
}

function syncCategoryLoadMoreButton(button) {
  if (!button) {
    return;
  }

  const label = button.querySelector('.load-more-label');
  const spinner = button.querySelector('.load-more-spinner');
  const hasMore = categoryPageState.visibleCount < categoryPageState.stories.length;

  button.hidden = !hasMore;
  button.disabled = categoryPageState.isLoading || !hasMore;
  button.setAttribute('aria-busy', categoryPageState.isLoading ? 'true' : 'false');

  if (label) {
    label.textContent = categoryPageState.isLoading ? 'Loading stories...' : 'Load more stories';
  }

  if (spinner) {
    spinner.hidden = !categoryPageState.isLoading;
  }
}

function createStoryCard(story) {
  if (!story) {
    return null;
  }

  const article = document.createElement('article');
  article.className = 'feed-card';
  article.setAttribute('itemscope', '');
  article.setAttribute('itemtype', 'https://schema.org/BlogPosting');

  const tagsMarkup = (story.tags || []).slice(0, 3).map((tag) => `<a href="#">${escapeHtml(String(tag).toUpperCase())}</a>`).join(', ');

  article.innerHTML = `
    <div class="feed-thumb-wrap">
      <a href="${buildStoryUrl(story)}" class="article-thumb-link">
        <img itemprop="image" src="${escapeHtml(story.imageUrl)}" alt="${escapeHtml(story.headline)}">
      </a>
    </div>
    <div class="feed-content">
      <div class="entry-meta-taxonomies"><span itemprop="keywords">${tagsMarkup}</span></div>
      <h2 class="entry-title"><a href="${buildStoryUrl(story)}" itemprop="url">${escapeHtml(story.headline)}</a></h2>
      <div class="entry-meta-details"><span class="author">By admin</span> <span class="sep">•</span> <time datetime="${escapeHtml(story.createdAt || '')}">${escapeHtml(formatStoryDate(story.createdAt))}</time></div>
      <div class="entry-summary"><p>${escapeHtml(getStorySnippet(story))}</p></div>
      <div class="feed-footer"><a href="${buildStoryUrl(story)}" class="read-more">Read more</a><div class="metrics">${buildMetricsMarkup('0 Comment', '51 Views')}</div></div>
    </div>
  `;

  return article;
}

function renderMegamenuStories(stories) {
  const megaCards = Array.from(document.querySelectorAll('.mega-card'));

  megaCards.forEach((card, index) => {
    const story = stories[index];
    if (!story) {
      card.hidden = true;
      return;
    }

    card.hidden = false;

    const cardLink = card.querySelector('.mega-card-link') || card.querySelector('a');
    const image = card.querySelector('img');
    const title = card.querySelector('h3');
    const date = card.querySelector('.mega-date');

    if (cardLink) {
      cardLink.href = buildStoryUrl(story);
      cardLink.setAttribute('aria-label', `Read ${story.headline}`);
    }
    if (image) {
      image.src = story.imageUrl;
      image.alt = story.headline;
    }
    if (title) {
      title.textContent = story.headline;
    }
    if (date) {
      date.textContent = `admin • ${formatStoryDate(story.createdAt)}`;
    }
  });
}
