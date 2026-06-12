import { BodyMeasurements, SizeRecommendation } from '../types';

const TOP_SIZES_MALE = [
  { us: 'XS', eu: '44', uk: 'XS', asia: 'S',  chestMin: 0,  chestMax: 88 },
  { us: 'S',  eu: '46', uk: 'S',  asia: 'M',  chestMin: 88, chestMax: 94 },
  { us: 'M',  eu: '48', uk: 'M',  asia: 'L',  chestMin: 94, chestMax: 100 },
  { us: 'L',  eu: '50', uk: 'L',  asia: 'XL', chestMin: 100, chestMax: 108 },
  { us: 'XL', eu: '52', uk: 'XL', asia: 'XXL', chestMin: 108, chestMax: 116 },
  { us: 'XXL', eu: '54', uk: 'XXL', asia: '3XL', chestMin: 116, chestMax: 999 },
];

const TOP_SIZES_FEMALE = [
  { us: 'XS', eu: '32', uk: '6',  asia: 'XS', chestMin: 0,  chestMax: 82 },
  { us: 'S',  eu: '34', uk: '8',  asia: 'S',  chestMin: 82, chestMax: 88 },
  { us: 'M',  eu: '36', uk: '10', asia: 'M',  chestMin: 88, chestMax: 94 },
  { us: 'L',  eu: '38', uk: '12', asia: 'L',  chestMin: 94, chestMax: 100 },
  { us: 'XL', eu: '40', uk: '14', asia: 'XL', chestMin: 100, chestMax: 108 },
  { us: 'XXL', eu: '42', uk: '16', asia: 'XXL', chestMin: 108, chestMax: 999 },
];

const BOTTOM_SIZES = [
  { waistSize: '26"', euWaist: '66', ukWaist: '8',  waistMin: 0,  waistMax: 68 },
  { waistSize: '28"', euWaist: '71', ukWaist: '10', waistMin: 68, waistMax: 74 },
  { waistSize: '30"', euWaist: '76', ukWaist: '12', waistMin: 74, waistMax: 79 },
  { waistSize: '32"', euWaist: '81', ukWaist: '14', waistMin: 79, waistMax: 84 },
  { waistSize: '34"', euWaist: '86', ukWaist: '16', waistMin: 84, waistMax: 90 },
  { waistSize: '36"', euWaist: '91', ukWaist: '18', waistMin: 90, waistMax: 96 },
  { waistSize: '38"', euWaist: '96', ukWaist: '20', waistMin: 96, waistMax: 999 },
];

export const getSizeRecommendation = (
  m: BodyMeasurements,
  gender: 'male' | 'female' | 'unisex'
): SizeRecommendation => {
  const topTable = gender === 'female' ? TOP_SIZES_FEMALE : TOP_SIZES_MALE;
  const top = topTable.find(s => m.chest >= s.chestMin && m.chest < s.chestMax) ?? topTable[topTable.length - 1];
  const bottom = BOTTOM_SIZES.find(s => m.waist >= s.waistMin && m.waist < s.waistMax) ?? BOTTOM_SIZES[BOTTOM_SIZES.length - 1];
  const inseamIn = Math.round(m.inseam / 2.54);

  return {
    tops: { us: top.us, eu: top.eu, uk: top.uk, asia: top.asia },
    bottoms: { us: bottom.waistSize, eu: bottom.euWaist, uk: bottom.ukWaist, waistSize: bottom.waistSize },
    jeans: `${bottom.waistSize} x ${inseamIn}"`,
  };
};
