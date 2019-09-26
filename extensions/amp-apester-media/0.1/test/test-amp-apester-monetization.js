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
// import {BaseElement} from '../../../../src/base-element';
// import {Services} from '../../../../src/services';
// import {Signals} from '../../../../src/utils/signals';

import {handleCompanionAds} from '../monetization/index';
import {installDocService} from '../../../../src/service/ampdoc-impl';
import {
  registerServiceBuilderForDoc,
  resetServiceForTesting,
} from '../../../../src/service';
describes.realWin('amp-apester-media-monetization', {}, env => {
  let win, doc;
  let baseElement;
  let docInfo;
  let media;

  beforeEach(() => {
    win = env.win;
    doc = win.document;
    media = {};

    baseElement = doc.createElement('amp-apester-media');

    doc.body.appendChild(baseElement);
    docInfo = {
      canonicalUrl: 'https://www.example.com/path',
      sourceUrl: 'https://source.example.com/path',
    };
    installDocService(win, /* isSingleDoc */ true);
    resetServiceForTesting(win, 'documentInfo');
    return registerServiceBuilderForDoc(doc, 'documentInfo', function() {
      return {
        get: () => docInfo,
      };
    });
  });

  it('show display ad', () => {
    media.campaignData = createCampaignData(true);
    handleCompanionAds(media, baseElement);
    const displayAd = baseElement.parentNode.querySelector(
      'amp-ad[type=doubleclick]'
    );
    expect(displayAd).to.not.be.null;
    expect(displayAd).to.not.be.undefined;
    expect(baseElement.nextSibling).to.be.equal(displayAd);
  });
  it('show sr ad below', () => {
    media.campaignData = createCampaignData(false, false, true);
    return handleCompanionAds(media, baseElement).then(() => {
      const srAdBelow = baseElement.parentNode.querySelector(
        'amp-ad[type=blade]'
      );
      expect(srAdBelow).to.not.be.null;
      expect(srAdBelow).to.not.be.undefined;
      expect(baseElement.nextSibling).to.be.equal(srAdBelow);
    });
  });
  it('show sr ad above', () => {
    media.campaignData = createCampaignData(false, true, false);
    return handleCompanionAds(media, baseElement).then(() => {
      const srAboveAd = baseElement.parentNode.querySelector(
        'amp-ad[type=blade]'
      );
      expect(srAboveAd).to.not.be.null;
      expect(srAboveAd).to.not.be.undefined;
      expect(baseElement.previousSibling).to.be.equal(srAboveAd);
    });
  });
  it('show sr above with display', () => {
    media.campaignData = createCampaignData(true, true, false);
    return handleCompanionAds(media, baseElement).then(() => {
      const displayAd = baseElement.parentNode.querySelector(
        'amp-ad[type=doubleclick]'
      );
      expect(displayAd).to.not.be.null;
      expect(displayAd).to.not.be.undefined;
      expect(baseElement.nextSibling).to.be.equal(displayAd);
      const srAboveAd = baseElement.parentNode.querySelector(
        'amp-ad[type=blade]'
      );
      expect(srAboveAd).to.not.be.null;
      expect(srAboveAd).to.not.be.undefined;
      expect(baseElement.previousSibling).to.be.equal(srAboveAd);
    });
  });
  it('dont show ad if disabled amp companion ads', () => {
    media.campaignData = createCampaignData(true, true, false, true);
    return handleCompanionAds(media, baseElement).then(() => {
      const displayAd = baseElement.parentNode.querySelector(
        'amp-ad[type=doubleclick]'
      );
      expect(displayAd).to.be.null;
      const srAboveAd = baseElement.parentNode.querySelector(
        'amp-ad[type=blade]'
      );
      expect(srAboveAd).to.be.null;
    });
  });
});

function createCampaignData(
  display,
  srAbove,
  srBelow,
  disabledAmpCompanionAds
) {
  const campaignData = {
    'companionOptions': {
      'settings': {
        'slot': '/57806026/Dev_DT_300x250',
        'options': {
          'collapseEmpty': true,
          'refreshOnClick': 'none',
          'lockTime': 5000,
        },
        'bannerAdProvider': 'gdt',
        'bannerSizes': [[300, 250]],
      },
      'enabled': false,
      'video': {
        'videoTag': '5d14c0ded1fb9900016a3118',
        'enabled': false,
        'floating': {
          'enabled': false,
        },
        'companion': {
          'shouldPauseWhenOutOfView': true,
          'shouldForceViewability': true,
          'enabled': false,
        },
        'companion_below': {
          'shouldPauseWhenOutOfView': true,
          'shouldForceViewability': true,
          'enabled': false,
        },
        'provider': 'sr',
      },
    },
    'companionCampaignOptions': {
      'companionCampaignId': '5d8b267a50bf9482f458d2ca',
    },
  };
  if (display) {
    campaignData.companionOptions.enabled = true;
  }
  if (srAbove) {
    campaignData.companionOptions.video.enabled = true;
    campaignData.companionOptions.video.companion.enabled = true;
  }
  if (srBelow) {
    campaignData.companionOptions.video.enabled = true;
    campaignData.companionOptions.video.companion_below.enabled = true;
  }
  if (disabledAmpCompanionAds) {
    campaignData.disabledAmpCompanionAds = true;
  }
  return campaignData;
}
