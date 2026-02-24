import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import API_BASE_URL from "../utils/api";

export default function ProductCard({ product }) {
    const { addToCart } = useCart();

    return (
        <div className="bg-black border p-4">
            <img
                src={`${API_BASE_URL}${product.image}`}
                alt={product.title}
                className="w-full h-64 object-cover mb-4"
            />

            <h3 className="text-xl font-bold">{product.title}</h3>
            <p className="opacity-70">${product.price}</p>

            {/* ADD TO CART */}
            <button
                onClick={() => addToCart(product)}
                className="mt-4 w-full border py-2 hover:bg-white hover:text-black"
            >
                ADD TO CART
            </button>

            {/* VIEW PRODUCT */}
            <Link
                to={`/products/${product._id}`}
                className="mt-2 block text-center border py-2 hover:bg-neon hover:text-black"
            >
                VIEW PRODUCT
            </Link>
        </div>
    );
}