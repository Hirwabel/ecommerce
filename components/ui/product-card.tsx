import Stripe from "stripe";
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
    product: Stripe.Product
}


export const ProductCard = ({ product }: Props) => {
  const price = product.default_price as Stripe.Price;
    return (
      <Link href={"/products/1"}>
        <Card>
          {product.images && product.images[0] && (
              <div className="relative h-80 w-full bg-gray-100 flex items-center justify-center">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-contain transition-transform duration-500 ease-in-out"
                />
              </div>
            )}

            <CardHeader> 
              <CardTitle> {product.name} </CardTitle>
              <CardContent> 
                {price && price.unit_amount && (
                  <p className="text-xl text-white">
                    ${(price.unit_amount / 100).toFixed(2)}
                  </p>
                )} 
              </CardContent> 
            </CardHeader>
        </Card>
      </Link>
    );
};