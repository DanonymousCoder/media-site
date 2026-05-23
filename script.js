const STORIES_API_URL = 'https://rocktest-1gd2.vercel.app/api/stories';
const FALLBACK_IMAGE = 'assets/img/placeholder.svg';
const FALLBACK_AVATAR = 'assets/img/placeholder.svg';

let storiesPromise = null;

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

async function hydrateStoriesFromApi() {
  const storyList = (await fetchStories()).map(normalizeStory);
  if (!storyList.length) {
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

  const carouselStories = stories.slice(0, carouselSlides.length);
  const feedStartIndex = carouselSlides.length;
  const feedStories = stories.slice(feedStartIndex, feedStartIndex + feedCards.length);
  const sidebarStartIndex = feedStartIndex + feedCards.length;
  const miniStories = stories.slice(sidebarStartIndex, sidebarStartIndex + miniPostItems.length);
  const featuredStory = stories[sidebarStartIndex + miniPostItems.length] || stories[0];
  const trendingStories = getTrendingStories(stories, trendingCategoryItems.length);

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
  });

  window.requestAnimationFrame(() => {
    miniPostItems.forEach((item, index) => {
      const story = miniStories[index] || stories[index];
      if (!story) {
        item.hidden = true;
        return;
      }

      item.hidden = false;
      const image = item.querySelector('img');
      const titleLink = item.querySelector('.mini-post-meta h4 a');
      const date = item.querySelector('.mini-post-meta .date');

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
  const uniqueStories = [];
  const seenCategories = new Set();

  stories.forEach((story) => {
    const categoryKey = String(story.category || '').trim().toLowerCase();
    if (!categoryKey || seenCategories.has(categoryKey) || uniqueStories.length >= limit) {
      return;
    }

    seenCategories.add(categoryKey);
    uniqueStories.push(story);
  });

  return uniqueStories;
}

function renderTrendingCategories(categoryItems, stories) {
  categoryItems.forEach((item, index) => {
    const story = stories[index];
    const image = item.querySelector('img');
    const categoryName = item.querySelector('.category-name');

    if (!story) {
      item.hidden = true;
      return;
    }

    item.hidden = false;
    item.href = buildStoryUrl(story);
    item.setAttribute('aria-label', `Explore ${story.category} trending stories`);

    if (image) {
      image.src = story.imageUrl;
      image.alt = `${story.category} trending story`;
    }

    if (categoryName) {
      categoryName.textContent = (story.category || 'General').replace(/\b\w/g, (character) => character.toUpperCase());
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

  document.title = `${story.headline} — RockWater Media`;
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
