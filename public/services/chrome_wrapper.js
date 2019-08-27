import chrome from 'ui/chrome';

 let getNewPlatform = null;

 /**
 * Holds the original state of the navigation links "hidden" property
 * Helper for the readOnly functionality
 * @type {null|Object}
 */
let changedVisibility = {}

 if (! chrome.getNavLinkById) {
  getNewPlatform = require('ui/new_platform').getNewPlatform;
}

 function getNavLinks() {
  if (getNewPlatform) {
    return getNewPlatform().start.core.chrome.navLinks.getAll();
  }

   return chrome.getNavLinks();

 }

 function getNavLinkById(id) {
  if (getNewPlatform) {
    return getNewPlatform().start.core.chrome.navLinks.get(id);
  } else {
    return chrome.getNavLinkById(id);
  }
}

 function hideNavLink(id, isHidden, skipTracking = false) {
  // This is a bit of a hack to make sure that we detect
  // changes that happen between reading the original
  // state and resolving our info in the readOnly feature
  if (skipTracking === false) {
    changedVisibility[id] = isHidden;
  }

   updateNavLinkProperty(id, 'hidden', isHidden);
}

 /**
 * With 7.2, it seems like the way the lastSubUrl is handled changed
 *
 * If the requested id is enabled, the link to the last subUrl is reset.
 * @param id
 */
function resetLastSubUrl(id) {
  const navLink = getNavLinkById(id);
  if (! navLink) {
    return;
  }

   if (getNewPlatform) {
    updateNavLinkProperty(id, 'url', navLink.subUrlBase);
  } else {
    navLink.lastSubUrl = navLink.url;
  }
}

 /**
 * Update a nav link property.
 * Starting from / as of 7.2, only the following attributes
 * can be updated:
 * active, disabled, hidden, url and subUrlBase
 * @param id
 * @param property
 * @param value
 */
function updateNavLinkProperty(id, property, value) {
  if (getNewPlatform) {
    getNewPlatform().start.core.chrome.navLinks.update(id, {
      [property]: value
    });
  } else {
    let navLink = chrome.getNavLinkById(id);
    if (navLink) {
      navLink[property] = value;
    }
  }
}

 export let chromeWrapper = {
  getNavLinks,
  getNavLinkById,
  hideNavLink,
  updateNavLinkProperty,
  resetLastSubUrl,
  changedVisibility
}; 
