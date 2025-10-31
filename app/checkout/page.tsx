"use client";
import { useCartStore } from "@/store/cart-store";
import { Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

export default function CheckoutPage () {
    const { items } = useCartStore();
    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    if (total === 0 || items.length === 0){
        return <div><h1> Your Cart is Empty.</h1></div>
    }
    return (
      <div>
        <h1> Checkout </h1>
        <Card>
            <CardHeader>
                <CardTitle> Order Summary </CardTitle>
            </CardHeader>
            <CardContent>
                <ul>
                    {items.map((item) => (
                        <li key={item.id}>
                            <div>
                                <span> {item.name}</span>
                                <span> {((item.price * item.quantity) / 100).toFixed(2)} </span>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
        
      </div>
    )  
}