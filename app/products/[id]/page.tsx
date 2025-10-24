import { Stripe } from "";

export default async function ProductPage () {
  
  const product = Stripe.products.retrieve(paramid, {
    expand: ["default_price"]
  })
  return <ProductDetail />
}
