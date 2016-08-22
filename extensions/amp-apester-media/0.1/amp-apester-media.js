/**
 * Copyright 2016 The AMP HTML Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


import {CSS} from '../../../build/amp-apester-media-0.1.css';
import {user, dev} from '../../../src/log';
import {loadPromise} from '../../../src/event-helper';
import {isLayoutSizeDefined} from '../../../src/layout';
import {isExperimentOn} from '../../../src/experiments';
import {removeElement} from '../../../src/dom';
import {vsyncFor} from '../../../src/vsync';
import {xhrFor} from '../../../src/xhr';


/** @const */
const TAG = 'amp-apester-media';

/**
 * AMP Apester-media
 */
class AmpApesterMedia extends AMP.BaseElement {
  /** @override */
  preconnectCallback(onLayout) {
    this.preconnect.url(this.displayBaseUrl_, onLayout);
    this.preconnect.url(this.rendererBaseUrl_, onLayout);
  }

  /** @override */
  isLayoutSupported(layout) {
    return isLayoutSizeDefined(layout);
  }

  /** @override */
  viewportCallback(inViewport) {
    if (inViewport && !this.seen_) {
      if (this.iframe_) {
        dev().fine(TAG, 'media seen');
        this.seen_ = true;
        this.iframe_.contentWindow./*OK*/postMessage('interaction seen', '*');
      }
    }
  }

  /** @override */
  buildCallback() {

    // EXPERIMENT
    user().assert(isExperimentOn(this.win, TAG), `Enable ${TAG} experiment`);

    /**
     * @const @private {?string}
     */
    this.rendererBaseUrl_ = 'https://renderer.qmerce.com';

    /**
     * @const @private {?string}
     */
    this.displayBaseUrl_ = 'https://display.apester.com';

    /**
     * @private {boolean}
     */
    this.random = false;

    /**
     * @const @private {?string}
     */
    this.mediaAttribute_ = user().assert(
        (this.element.getAttribute('data-apester-media-id') ||
         (this.random =
             this.element.getAttribute('data-apester-channel-token'))),
        'Either the data-apester-media-id or the data-apester-channel-token ' +
        'attributes must be specified for <amp-apester-media> %s',
        this.element);

    /**
     * @private {?Element}
     */
    this.iframe_ = null;

    /**
     * @private {?Promise}
     */
    this.iframePromise_ = null;

    /**
     * @private {boolean}
     */
    this.seen_ = false;
    this.element.classList.add('apester-container');
  }

  /** @override */
  firstLayoutCompleted() {
    this.viewportCallback(this.isInViewport());

    // Do not hide placeholder
  }

  /**
   * @return {string}
   **/
  buildUrl_() {
    const suffix = (this.random) ?
        `/tokens/${this.mediaAttribute_}/interactions/random` :
        `/interactions/${this.mediaAttribute_}/display`;
    return encodeURIComponent(`${this.displayBaseUrl_}${suffix}`);
  }

  /**
   * @return {!Promise<!JSONType>}
   **/
  queryMedia_() {
    const url = decodeURIComponent(this.buildUrl_());
    return xhrFor(this.win).fetchJson(url);
  }

  /** @param {string}
   * @return {string}
   * */
  constructUrlFromMedia_(id) {
    return encodeURIComponent(this.rendererBaseUrl_ + '/interaction/' + id);
  }

  /** @param {string}
   * @return {!Element}
   */
  constructIframe_(src) {
    const iframe = this.element.ownerDocument.createElement('iframe');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowtransparency', 'true');
    iframe.setAttribute('scrolling', 'no');
    iframe.src = src;
    iframe.height = this.element.getAttribute('height');
    iframe.classList.add('apester-iframe');
    this.applyFillContent(iframe);
    return iframe;
  }

  /**
   * @return {!Element}
   */
  constructOverflow_() {
    const overflow = this.element.ownerDocument.createElement('div');
    overflow.setAttribute('overflow', '');
    overflow.className = 'apester-overflow-container';
    const overflowButton = this.element.ownerDocument.createElement('button');
    overflowButton.className = 'apester-overflow-button';
    overflowButton.textContent = 'Start Here';
    overflow.appendChild(overflowButton);
    return overflow;
  }

  /** @override */
  layoutCallback() {
    return this.queryMedia_()
        .then(response => {
          const media = response.payload;
          const src = decodeURIComponent(this.constructUrlFromMedia_(media.interactionId));
          const iframe = this.constructIframe_(src);
          const overflow = this.constructOverflow_();
          const mutate = state => {
            state.element.classList.add('apester-iframe-ready');
          };
          const state = {
            element: iframe, mutator: mutate,
          };
          this.iframe_ = iframe;
          this.element.appendChild(overflow);
          this.element.appendChild(iframe);
          return this.iframePromise_ = loadPromise(iframe).then(() => {
            vsyncFor(this.win).runPromise({mutate}, state);
            return media;
          });
        }, error => {
          dev().error(TAG, 'Display', error);
          return undefined;
        }).then(media => {
          this.togglePlaceholder(false);
          let height = 0;
          if (media) {
            height = media.data.size.height;
            const width = media.data.size.width;
            height += (media.layout.directive === 'contest-poll') ? 40 : 0;
            const amp = this.element;
            amp.setAttribute('height', height);
            amp.setAttribute('width', width);
          }
          this./*OK*/attemptChangeHeight(height);
        });
  }

  /** @override */
  unlayoutOnPause() {
    return true;
  }

  /** @override */
  unlayoutCallback() {
    if (this.iframe_) {
      removeElement(this.iframe_);
      this.iframe_ = null;
      this.iframePromise_ = null;
    }
    return true; //Call layoutCallback again.
  }
}

AMP.registerElement('amp-apester-media', AmpApesterMedia, CSS);
