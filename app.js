import fetch from 'node-fetch';

const ADMIN_API_URL = 'https://anatta-test-store.myshopify.com/admin/api/2023-04/graphql.json';
const ADMIN_TOKEN = '';
const args = process.argv.slice(2);

if (args.length < 2 || args[0] !== '--name') {
    console.error('Usage: node app.js --name <product_name>');
    process.exit(1);
}

const productName = args[1];

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
                    variants(first: 250) {
                        edges {
                            node {
                                title
                                price
                            }
                        }
                    }
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

const displayVariants = (products, name) => {
    const filteredProducts = products.filter(product =>
        product.node.title.toLowerCase().includes(name.toLowerCase())
    );

    if (filteredProducts.length === 0) {
        console.log('No products found.');
        return;
    }

    filteredProducts.forEach((product) => {
        const variants = product.node.variants.edges
            .map(edge => edge.node)
            .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

        variants.forEach(variant => {
            console.log(`${product.node.title} - ${variant.title} - price $${variant.price}`);
        });
    });
};

const main = async () => {
    const allProducts = await fetchAllProducts();
    displayVariants(allProducts, productName);
};

main();
