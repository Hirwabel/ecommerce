import Stripe from "stripe";
import Image from "next/image"


interface Props {
    product: Stripe.Product
}


export const ProductDetail = ({product} :  Props ) => {

  const price = product.default_price as Stripe.Price;

  return (
    <div>
      {product.images && product.images[0] && (
        <div className="relative h-80 w-150 bg-gray-100 flex items-center justify-center overflow-hidden">
            <Image
                src={product.images[0]}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                /*objectFit="cover"*/
                className="transition duration-300 hover:opacity-90 items-center"
                      />
        </div>
      )}

      <div>
        <h1> {product.name} </h1>
        {product.description && (<p> {product.description} </p>)}

        {price && price.unit_amount && (
                  <p className="text-lg font-semibold text-gray-900">
                  ${(price.unit_amount / 100).toFixed(2)}
                  </p>
                )}
      </div>
      
    </div>
  );
}