document.addEventListener('DOMContentLoaded', function(){
  const body = document.body;

  // Mobile drawer elements
  const mobileTrigger = document.getElementById('mobile-drawer-trigger');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const drawerOverlay = document.getElementById('mobile-drawer-overlay');
  const drawerClose = document.querySelector('.drawer-close-btn');

  function openDrawer(){
    if(mobileDrawer){
      mobileDrawer.classList.add('open');
      mobileDrawer.setAttribute('aria-hidden','false');
    }
    if(drawerOverlay){
      drawerOverlay.classList.add('visible');
      drawerOverlay.setAttribute('aria-hidden','false');
    }
    if(mobileTrigger){
      mobileTrigger.setAttribute('aria-expanded','true');
    }
    body.classList.add('drawer-open');
  }

  function closeDrawer(){
    if(mobileDrawer){
      mobileDrawer.classList.remove('open');
      mobileDrawer.setAttribute('aria-hidden','true');
    }
    if(drawerOverlay){
      drawerOverlay.classList.remove('visible');
      drawerOverlay.setAttribute('aria-hidden','true');
    }
    if(mobileTrigger){
      mobileTrigger.setAttribute('aria-expanded','false');
    }
    body.classList.remove('drawer-open');
  }

  if(mobileTrigger){
    mobileTrigger.addEventListener('click', (e) => {
      const expanded = mobileTrigger.getAttribute('aria-expanded') === 'true';
      if(expanded) closeDrawer(); else openDrawer();
    });
  }

  if(drawerClose){ drawerClose.addEventListener('click', closeDrawer); }
  if(drawerOverlay){ drawerOverlay.addEventListener('click', closeDrawer); }

  // Mega menu triggers
  document.querySelectorAll('.megamenu-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      // close any other open megamenus
      document.querySelectorAll('.megamenu-trigger').forEach(b => {
        if(b !== btn){ b.setAttribute('aria-expanded','false'); const dd = b.nextElementSibling; if(dd) dd.setAttribute('aria-hidden','true'); }
      });
      btn.setAttribute('aria-expanded', String(!expanded));
      const dropdown = btn.nextElementSibling;
      if(dropdown){ dropdown.setAttribute('aria-hidden', String(expanded)); }
    });
  });

  // close overlays/menus on Escape
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){
      closeDrawer();
      document.querySelectorAll('.megamenu-trigger').forEach(b=>{ b.setAttribute('aria-expanded','false'); const dd=b.nextElementSibling; if(dd) dd.setAttribute('aria-hidden','true'); });
    }
  });

  // Carousel functionality
  const carouselTrack = document.getElementById('carousel-track');
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');

  if(carouselTrack && prevBtn && nextBtn){
    const slideWidth = 300; // approximate width of a slide + gap
    prevBtn.addEventListener('click', () => {
      carouselTrack.scrollBy({ left: -slideWidth, behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', () => {
      carouselTrack.scrollBy({ left: slideWidth, behavior: 'smooth' });
    });
  }
});
