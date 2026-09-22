/** Seed catalog. Titles are generic grocery items; native ids are fabricated, not real retailer ids. */
export type SeedProduct = {
  native_id: string;
  gtin: string | null;
  brand: string;
  title: string;
  size: string;
  base: number;
};

const grocery: Omit<SeedProduct, 'native_id'>[] = [
  { gtin: '0001111041660', brand: 'Store Brand', title: 'Whole Milk', size: '1 gal', base: 3.79 },
  { gtin: '0001111042100', brand: 'Store Brand', title: 'Large Eggs', size: '12 ct', base: 3.29 },
  {
    gtin: '0001111060903',
    brand: 'Store Brand',
    title: 'Unsalted Butter',
    size: '16 oz',
    base: 4.49,
  },
  {
    gtin: '0003800000127',
    brand: 'Kellogg',
    title: 'Corn Flakes Cereal',
    size: '18 oz',
    base: 4.19,
  },
  { gtin: '0001600027528', brand: 'General Mills', title: 'Cheerios', size: '18 oz', base: 4.99 },
  {
    gtin: '0002100000014',
    brand: 'Kraft',
    title: 'Macaroni and Cheese Dinner',
    size: '7.25 oz',
    base: 1.49,
  },
  {
    gtin: '0004900001180',
    brand: 'Coca-Cola',
    title: 'Coca-Cola 12 pk',
    size: '12 x 12 fl oz',
    base: 8.99,
  },
  {
    gtin: '0001200000230',
    brand: 'Pepsi',
    title: 'Pepsi 12 pk',
    size: '12 x 12 fl oz',
    base: 8.99,
  },
  {
    gtin: '0007874201148',
    brand: 'Store Brand',
    title: 'White Sandwich Bread',
    size: '20 oz',
    base: 2.29,
  },
  {
    gtin: '0001111079321',
    brand: 'Store Brand',
    title: 'Chicken Breast Boneless Skinless',
    size: 'per lb',
    base: 4.29,
  },
  {
    gtin: '0001111091732',
    brand: 'Store Brand',
    title: 'Ground Beef 80/20',
    size: '1 lb',
    base: 5.49,
  },
  {
    gtin: '0002800011112',
    brand: 'Skippy',
    title: 'Creamy Peanut Butter',
    size: '16.3 oz',
    base: 3.49,
  },
  { gtin: '0005150024145', brand: 'Smucker', title: 'Strawberry Jam', size: '18 oz', base: 3.99 },
  { gtin: '0004800012340', brand: 'Heinz', title: 'Tomato Ketchup', size: '32 oz', base: 4.29 },
  { gtin: '0001111018745', brand: 'Store Brand', title: 'Bananas', size: 'per lb', base: 0.59 },
  { gtin: '0001111018760', brand: 'Store Brand', title: 'Hass Avocado', size: 'each', base: 1.19 },
  {
    gtin: '0003700000042',
    brand: 'Tide',
    title: 'Liquid Laundry Detergent',
    size: '92 fl oz',
    base: 13.99,
  },
  {
    gtin: '0003700081921',
    brand: 'Charmin',
    title: 'Ultra Soft Toilet Paper',
    size: '12 mega rolls',
    base: 14.49,
  },
  {
    gtin: '0003700076400',
    brand: 'Bounty',
    title: 'Paper Towels',
    size: '6 double rolls',
    base: 11.99,
  },
  {
    gtin: '0007007450081',
    brand: 'Store Brand',
    title: 'Shredded Cheddar Cheese',
    size: '8 oz',
    base: 2.79,
  },
  {
    gtin: '0001111083341',
    brand: 'Store Brand',
    title: 'Greek Yogurt Plain',
    size: '32 oz',
    base: 4.99,
  },
  {
    gtin: '0003800039103',
    brand: 'Kellogg',
    title: 'Eggo Homestyle Waffles',
    size: '10 ct',
    base: 3.49,
  },
  {
    gtin: '0002000012345',
    brand: 'Green Giant',
    title: 'Frozen Sweet Corn',
    size: '12 oz',
    base: 1.99,
  },
  {
    gtin: '0001111087654',
    brand: 'Store Brand',
    title: 'Orange Juice No Pulp',
    size: '52 fl oz',
    base: 3.99,
  },
  {
    gtin: '0004300020750',
    brand: 'Maxwell House',
    title: 'Ground Coffee Original Roast',
    size: '30.6 oz',
    base: 12.49,
  },
  {
    gtin: '0001111011223',
    brand: 'Store Brand',
    title: 'Long Grain White Rice',
    size: '5 lb',
    base: 4.79,
  },
  { gtin: '0002400016214', brand: 'Barilla', title: 'Spaghetti', size: '16 oz', base: 1.79 },
  { gtin: '0007680850153', brand: 'Rao', title: 'Marinara Sauce', size: '24 oz', base: 8.49 },
  { gtin: '0001111065422', brand: 'Store Brand', title: 'Baby Carrots', size: '1 lb', base: 1.69 },
  {
    gtin: '0001111065444',
    brand: 'Store Brand',
    title: 'Romaine Hearts',
    size: '3 ct',
    base: 3.29,
  },
  { gtin: '0004400002323', brand: 'Nabisco', title: 'Oreo Cookies', size: '14.3 oz', base: 4.49 },
  {
    gtin: '0002840056112',
    brand: 'Frito-Lay',
    title: 'Lay Classic Potato Chips',
    size: '8 oz',
    base: 4.79,
  },
  {
    gtin: '0001111076543',
    brand: 'Store Brand',
    title: 'Sparkling Water Lime 8 pk',
    size: '8 x 12 fl oz',
    base: 3.99,
  },
  {
    gtin: '0003800020013',
    brand: 'Pringles',
    title: 'Original Crisps',
    size: '5.2 oz',
    base: 2.29,
  },
  {
    gtin: '0001111054321',
    brand: 'Store Brand',
    title: 'Ibuprofen Tablets 200 mg',
    size: '100 ct',
    base: 6.99,
  },
];

export function productsFor(retailerSlug: string, idPrefix: string, count: number): SeedProduct[] {
  return grocery.slice(0, count).map((p, i) => ({
    ...p,
    native_id: `${idPrefix}${(100000 + i * 137).toString()}`,
    // H-E-B and Kroger price the same UPC a little differently; keep retailers distinct in seed too.
    base:
      Math.round(
        p.base * (retailerSlug === 'heb' ? 0.97 : retailerSlug === 'instacart' ? 1.12 : 1) * 100,
      ) / 100,
  }));
}

/** Uber service tuples: coarse H3 cells (resolution 5) in Houston, tier, time bucket. Cells are illustrative. */
export const uberTuples = [
  {
    origin_cell: '85446d47fffffff',
    dest_cell: '85446d43fffffff',
    service_tier: 'UberX',
    time_bucket: 'weekday_am_peak',
    base: 24.5,
  },
  {
    origin_cell: '85446d47fffffff',
    dest_cell: '85446d43fffffff',
    service_tier: 'UberX',
    time_bucket: 'weekday_off_peak',
    base: 18.9,
  },
  {
    origin_cell: '85446d43fffffff',
    dest_cell: '85446d47fffffff',
    service_tier: 'UberX',
    time_bucket: 'weekday_pm_peak',
    base: 27.2,
  },
  {
    origin_cell: '85446d47fffffff',
    dest_cell: '85446d5bfffffff',
    service_tier: 'Comfort',
    time_bucket: 'weekend',
    base: 41.0,
  },
];

export const playbookSteps: Record<string, { id: string; title: string; detail: string }[]> = {
  kroger: [
    {
      id: 'clip-digital',
      title: 'Clip the digital coupon',
      detail:
        'Open the item in the Kroger app and tap Clip. Digital coupons are the most common personalized offer.',
    },
    {
      id: 'logout-web',
      title: 'Check the price logged out on the website',
      detail:
        'Open kroger.com in a private window, pick your store, and compare. This is the anonymous baseline.',
    },
    {
      id: 'switch-store',
      title: 'Try a nearby store',
      detail:
        'Change the pickup store to another location in your metro. Store-level pricing differs.',
    },
    {
      id: 'wait-cart',
      title: 'Leave it in the cart overnight',
      detail: 'Abandoned-cart offers are common. Check again tomorrow.',
    },
    {
      id: 'no-loyalty',
      title: 'Compare without the loyalty card',
      detail: 'Shop without signing in and compare the shelf price to the member price.',
    },
  ],
  heb: [
    {
      id: 'logout-web',
      title: 'Check the price logged out on heb.com',
      detail: 'Open heb.com in a private window and pick your store.',
    },
    {
      id: 'switch-store',
      title: 'Try a nearby store',
      detail: 'Change the store in the app. H-E-B prices vary by store.',
    },
    {
      id: 'coupon-tab',
      title: 'Check the Coupons tab',
      detail: 'Some offers are shown only under Coupons, not on the item page.',
    },
    {
      id: 'wait-cart',
      title: 'Leave it in the cart overnight',
      detail: 'Come back tomorrow before checking out.',
    },
  ],
  instacart: [
    {
      id: 'switch-retailer',
      title: 'Check the same item at another store on Instacart',
      detail: 'The same item can be cheaper through a different retailer storefront.',
    },
    {
      id: 'logout-web',
      title: 'Compare in a private browser window',
      detail: 'Enter your ZIP and compare without signing in.',
    },
    {
      id: 'change-zip',
      title: 'Try a different delivery ZIP in your metro',
      detail: 'Delivery ZIP changes the storefront and sometimes the price.',
    },
    {
      id: 'wait-cart',
      title: 'Abandon the cart and check tomorrow',
      detail: 'Cart-recovery promotions are common.',
    },
    {
      id: 'remove-plus',
      title: 'Compare with and without Instacart+',
      detail: 'Fees and item prices can differ for members.',
    },
  ],
  uber: [
    {
      id: 'wait-refresh',
      title: 'Wait two minutes and re-request',
      detail: 'Fares move within a minute. A second quote is often lower.',
    },
    {
      id: 'move-pin',
      title: 'Move the pickup pin one block',
      detail: 'Pickup cell changes the surge zone.',
    },
    {
      id: 'compare-tier',
      title: 'Compare UberX and Comfort',
      detail: 'Tiers are priced independently; the gap is sometimes inverted.',
    },
    {
      id: 'web-quote',
      title: 'Get a quote at m.uber.com logged out',
      detail: 'The anonymous web quote is a useful reference.',
    },
  ],
};
