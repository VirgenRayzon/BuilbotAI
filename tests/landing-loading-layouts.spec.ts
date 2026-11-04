import {test,expect} from '@playwright/test';

for(const width of [1440,768,390]) {
  test(`landing sections preserve geometry at ${width}px`,async({page})=>{
    test.setTimeout(60000);
    await page.setViewportSize({width,height:900});
    let releaseProducts!:()=>void;
    let releaseAccessories!:()=>void;
    const productsReady=new Promise<void>(resolve=>{releaseProducts=resolve;});
    const accessoriesReady=new Promise<void>(resolve=>{releaseAccessories=resolve;});
    const product={productId:'audit',name:'Gigabyte GeForce RTX 5090 WINDFORCE OC 32G',category:'GPU',brand:'Gigabyte',price:10000,imageUrl:'',inStock:true};
    await page.route('**/api/featured-parts',async route=>{await productsReady;await route.fulfill({json:Array.from({length:12},(_,i)=>({...product,productId:`part-${i}`}))});});
    await page.route('**/api/featured-accessories',async route=>{await accessoriesReady;await route.fulfill({json:Array.from({length:4},(_,i)=>({...product,productId:`accessory-${i}`,category:'Monitor'}))});});
    await page.goto('http://localhost:9002/');
    for(const [id,release] of [['featured-products-heading',releaseProducts],['accessories-heading',releaseAccessories]] as const){
      const section=page.locator(`section[aria-labelledby="${id}"]`);
      await section.scrollIntoViewIfNeeded();
      await expect(section.locator('[aria-busy="true"]')).toBeVisible();
      const before=await section.locator('.mantine-Card-root').first().boundingBox();
      const sectionBefore=await section.boundingBox();
      await section.screenshot({path:`tmp/loading-audit/${id}-loading-${width}.png`,style:'header{visibility:hidden}'});
      release();
      await expect(section.locator('[aria-busy="true"]')).toHaveCount(0);
      await expect.poll(async()=>Math.abs((await section.locator('.mantine-Card-root').first().boundingBox())!.width-before!.width)).toBeLessThanOrEqual(1);
      const after=await section.locator('.mantine-Card-root').first().boundingBox();
      expect(Math.abs(before!.height-after!.height)).toBeLessThanOrEqual(1);
      expect(Math.abs(sectionBefore!.height-(await section.boundingBox())!.height)).toBeLessThanOrEqual(8);
      await section.screenshot({path:`tmp/loading-audit/${id}-loaded-${width}.png`,style:'header{visibility:hidden}'});
    }
  });
}
