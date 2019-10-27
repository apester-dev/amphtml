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

import {Services} from '../../../../../src/services';
const ALLOWED_AD_PROVIDER = 'sr';
import {MARGIN_AD_HEIGHT} from '../monetization-utils';
import {getValueForExpr} from '../../../../../src/json';
import {setStyle} from '../../../../../src/style';

/**
 * @param {!JsonObject} media
 * @param {AmpElement} apesterElement
 * @param {!JsonObject} consentObj
 * @return {number}
 */
export function handleCompanionVideo(media, apesterElement, consentObj) {
  const adInfo = getVideoAdInfo(media);
  if (!isVideoAdShouldShow(adInfo)) {
    return 0;
  }
  const {companionCampaignOptions, videoSettings, position} = adInfo;
  const macros = getSrMacros(
    media,
    companionCampaignOptions['companionCampaignId'],
    apesterElement,
    consentObj
  );
  const videoAdSize = constructCompanionSrElement(
    videoSettings['videoTag'],
    position,
    /** @type {!JsonObject} */ (macros),
    apesterElement
  );

  const heightAdWithMargin = MARGIN_AD_HEIGHT * 2 + videoAdSize.height;
  return heightAdWithMargin;
}

/**
 * @param {!JsonObject} media
 * @return {?JsonObject}
 */
export function getVideoAdInfo(media) {
  const companionCampaignOptions = getValueForExpr(
    media,
    'campaignData.companionCampaignOptions'
  );
  const videoSettings = getValueForExpr(
    media,
    'campaignData.companionOptions.video'
  );
  const position = getCompanionPosition(videoSettings);

  return {companionCampaignOptions, videoSettings, position};
}

/**
 * @param {!JsonObject} adInfo
 * @return {boolean}
 */
function isVideoAdShouldShow(adInfo) {
  const {companionCampaignOptions, videoSettings, position} = adInfo;
  if (
    !companionCampaignOptions ||
    !videoSettings ||
    !videoSettings['enabled'] ||
    videoSettings['provider'] !== ALLOWED_AD_PROVIDER ||
    !position ||
    position === 'floating'
  ) {
    return false;
  }
  return true;
}

/**
 * @param {!JsonObject} video
 * @return {?string}
 */
function getCompanionPosition(video) {
  if (video) {
    if (video['companion']['enabled']) {
      return 'above';
    }
    if (video['companion_below']['enabled']) {
      return 'below';
    }
    if (video['floating']['enabled']) {
      return 'floating';
    }
  }
}

/**
 * @param {string} videoTag
 * @param {string} position
 * @param {!JsonObject} macros
 * @param {AmpElement} apesterElement
 * @return {JsonObject}
 */
function constructCompanionSrElement(
  videoTag,
  position,
  macros,
  apesterElement
) {
  const size = getCompanionVideoAdSize(apesterElement);
  const ampAd = apesterElement.ownerDocument.createElement('amp-ad');
  ampAd.setAttribute('type', 'blade');
  ampAd.setAttribute('data-blade_player_type', 'bladex');
  ampAd.setAttribute('servingDomain', 'ssr.streamrail.net');
  ampAd.setAttribute('height', size.height);
  ampAd.setAttribute('width', size.width);
  ampAd.setAttribute('layout', 'responsive');
  ampAd.setAttribute('data-blade_macros', JSON.stringify(macros));
  ampAd.setAttribute('data-blade_player_id', videoTag);
  ampAd.setAttribute('data-blade_api_key', '5857d2ee263dc90002000001');
  ampAd.classList.add('amp-apester-companion');
  setStyle(ampAd, 'margin', `${MARGIN_AD_HEIGHT}px auto`);

  position === 'below'
    ? apesterElement.appendChild(ampAd)
    : apesterElement.insertBefore(ampAd, apesterElement.firstChild);

  return size;
}

/**
 * @param {AmpElement} apesterElement
 * @return {{height: number, width: number}}
 */
export function getCompanionVideoAdSize(apesterElement) {
  const adWidth = apesterElement./*REVIEW*/ clientWidth;
  const adRatio = 0.6;
  const adHeight = Math.ceil(adWidth * adRatio);
  return {width: adWidth, height: adHeight};
}

/**
 * @param {!JsonObject} interactionModel
 * @param {?string} campaignId
 * @param {AmpElement} apesterElement
 * @param {!JsonObject} consentObj
 * @return {{
 * gdpr: ?number,
 * page_url: string,
 * param1: string,
 * param2: ?string,
 * param4: ?string,
 * param6: ?string,
 * param7: ?string,
 * schain: ?string,
 * user_consent: ?string
 * }}
 */
function getSrMacros(interactionModel, campaignId, apesterElement, consentObj) {
  const interactionId = interactionModel['interactionId'];
  const publisherId = interactionModel['publisherId'];
  const publisher = interactionModel['publisher'];

  const pageUrl = Services.documentInfoForDoc(apesterElement).canonicalUrl;
  const macros = {
    param1: interactionId,
    param2: publisherId,
    param6: campaignId,
    page_url: pageUrl, // eslint-disable-line google-camelcase/google-camelcase
  };

  if (consentObj['gdpr']) {
    macros.gdpr = consentObj['gdpr'];
    macros.user_consent = consentObj['user_consent']; // eslint-disable-line google-camelcase/google-camelcase
    macros.param4 = consentObj['gdprString'];
  }

  if (publisher && publisher.groupId) {
    macros.param7 = `apester.com:${publisher.groupId}`;
    macros.schain = `1.0,1!apester.com,${publisher.groupId},1,,,,`;
  }
  return macros;
}
