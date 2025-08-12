ProductDetail page has been removed.

Detail functionality is now integrated into Products via the `productId` query parameter.

Deep link examples:
- /products?productId=<PRODUCT_ID>
- /products?category=<CATEGORY>

Changes:
- src/pages/ProductDetail.tsx removed (please delete file from repo if still present)
- src/pages/Products.tsx now renders product detail section when `productId` exists
- src/components/ProductCard navigates to /products?productId=<id> on details
- src/App.tsx route /product/:id removed
