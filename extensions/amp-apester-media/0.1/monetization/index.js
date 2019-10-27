/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
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
import {
  DISPLAY_AD_ELEMENT_ID,
  MARGIN_AD_HEIGHT,
  VIDEO_AD_ELEMENT_ID,
  addDisplayElement,
  addVideoElement,
  createPlaceHolderElement,
} from '../monetization/monetization-utils';
import {
  getCompanionVideoAdSizeIfVideoAllowed,
  getVideoAdInfo,
  handleCompanionVideo,
} from './companion/video';
import {getConsentData} from './consent-util';
import {getDisplayAdInfo, handleCompanionDisplay} from './companion/display';

/**
 * @param {!JsonObject} media
 * @param {AmpElement} apesterElement
 * @return {Promise}
 */
export function handleCompanionAds(media, apesterElement) {
  const monetizationSettings = media['campaignData'];
  if (monetizationSettings && !monetizationSettings.disabledAmpCompanionAds) {
    return getConsentData(apesterElement).then(consentData => {
      handleCompanionDisplay(media, apesterElement);
      handleCompanionVideo(media, apesterElement, consentData);
    });
  }
  return Promise.resolve();
}

/**
 * @param {!JsonObject} media
 * @param {AmpElement} apesterElement
 * @return {JsonObject}
 */
export function getAdsDimension(media, apesterElement) {
  const videoAdInfo = getVideoAdInfo(media);
  const displayAdInfo = getDisplayAdInfo(media);

  const videoAdSize = getCompanionVideoAdSizeIfVideoAllowed(
    apesterElement,
    videoAdInfo
  );
  const displayAdSize =
    displayAdInfo && displayAdInfo.size ? displayAdInfo.size : undefined;

  const {position} = videoAdInfo;
  const adsSize = {displayAdSize, video: {size: videoAdSize, position}};
  return adsSize;
}

/**
 * @param {JsonObject} adsDimension
 * @return {JsonObject}
 */
export function addPlaceHolderAds(adsDimension = {}) {
  const {displayAdSize, video} = adsDimension;

  if (adsDimension && adsDimension.displayAdSize) {
    const displayAdPlaceholder = this.createPlaceHolderElement(
      displayAdSize,
      DISPLAY_AD_ELEMENT_ID
    );
    addDisplayElement(this.element, displayAdPlaceholder);
  }

  if (video) {
    const {size, position} = video;
    const videoAdPlaceholder = this.createPlaceHolderElement(
      size,
      VIDEO_AD_ELEMENT_ID
    );
    addVideoElement(this.element, videoAdPlaceholder, position);
  }
}
