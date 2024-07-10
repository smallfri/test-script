import fetch from 'node-fetch';

const ADMIN_API_URL = 'https://anatta-test-store.myshopify.com/admin/api/2023-04/graphql.json';
const ADMIN_TOKEN = 'YOUR_SHOPIFY_ACCESS_TOKEN';

const query = `
    query($cursor: String) {
        products(first: 250, after: $cursor) {
            pageInfo {
                hasNextPage
                endCursor
            }
            edges {
                node {
                    title
                }
            }
        }
    }
`;

const fetchAllProducts = async () => {
    let allProducts = [];
    let hasNextPage = true;
    let cursor = null;

    try {
        while (hasNextPage) {
            console.log(`Fetching products with cursor: ${cursor}`);
            const response = await fetch(ADMIN_API_URL, {
                method: 'POST',
                headers: {
                    'X-Shopify-Access-Token': ADMIN_TOKEN,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    variables: { cursor }
                }),
            });

            const data = await response.json();
            console.log('Response received:', JSON.stringify(data, null, 2));

            if (data.errors) {
                console.error('Errors:', data.errors);
                process.exit(1);
            }

            const products = data.data.products.edges;
            allProducts = allProducts.concat(products);
            hasNextPage = data.data.products.pageInfo.hasNextPage;
            cursor = data.data.products.pageInfo.endCursor;
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        process.exit(1);
    }

    return allProducts;
};

const displayProductNames = (products) => {
    if (products.length === 0) {
        console.log('No products found.');
        return;
    }

    products.forEach((product) => {
        console.log(product.node.title);
    });
};

const main = async () => {
    const allProducts = await fetchAllProducts();
    displayProductNames(allProducts);
};

main();
