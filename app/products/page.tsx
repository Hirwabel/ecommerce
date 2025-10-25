import { stripe } from "@/lib/stripe";
import { ProductList } from "@/components/ui/product-list";


export default async function ProductsPage () {
  
  const products = await stripe.products.list({
    expand: ["data.default_price"],
  });

  
    return <div>
             <h1> All Products </h1>
             <ProductList products={products.data}/>
           </div>;
}