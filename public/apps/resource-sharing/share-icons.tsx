/*
 *   Copyright OpenSearch Contributors
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import React from 'react';

/**
 * Custom SVG icons matching the resource-sharing UX prototype. OUI does not
 * ship these exact glyphs, so they are provided as components and passed to
 * EUI `iconType` props / rendered inline. All use `currentColor` so they
 * inherit the surrounding text/button color.
 */

const base = {
  width: 13,
  height: 13,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

/** Two people — the "Shared" status glyph. */
export const SharedWithIcon: React.FC = (props) => (
  <svg {...base} {...props}>
    <circle cx="6" cy="5.5" r="2.4" />
    <path d="M1.8 13c0-2.3 1.9-3.7 4.2-3.7s4.2 1.4 4.2 3.7" />
    <path d="M11 4.2a2.2 2.2 0 010 4.3M12.2 12.9c0-1.6-.6-2.7-1.7-3.3" />
  </svg>
);

/** Padlock — the "Private" status glyph and no-permission action glyph. */
export const PrivateLockIcon: React.FC = (props) => (
  <svg {...base} {...props}>
    <rect x="3.4" y="7" width="9.2" height="6.4" rx="1.4" />
    <path d="M5.6 7V5.2a2.4 2.4 0 014.8 0V7" />
  </svg>
);

/** Connected nodes — the "share" action glyph. */
export const ShareNodesIcon: React.FC = (props) => (
  <svg {...base} strokeWidth={1.5} width={15} height={15} {...props}>
    <circle cx="12" cy="3.6" r="1.8" />
    <circle cx="4" cy="8" r="1.8" />
    <circle cx="12" cy="12.4" r="1.8" />
    <path d="M5.6 7.1l4.8-2.6M5.6 8.9l4.8 2.6" />
  </svg>
);
