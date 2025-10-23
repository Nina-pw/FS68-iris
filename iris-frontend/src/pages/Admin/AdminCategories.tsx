import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaPen, FaTrash, FaTags } from "react-icons/fa";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "./Products.css";

const MySwal = withReactContent(Swal);

interface Variant {
  id: number;
  pId: number;
  sku: string;
  shadeName: string | null;
  shadeCode: string | null;
  price: number;
  stockQty: number;
  imageUrl: string | null;
}

interface Product {
  pId: number;
  pname: string;
  description: string;
  basePrice: number;
  pcId: number | null;
  primaryImageUrl: string | null;
  images: string[] | null;
  variants?: Variant[];
}

interface Category {
  id: number;
  name: string;
}

export default function AdminCategories() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

const loadProducts = async () => {
  try {
    setLoading(true);
    const res = await fetch(`${import.meta.env.VITE_API_URL}/products`);
    const data = await res.json();
    // ✅ เรียงจาก id มาก → น้อย (ล่าสุดอยู่บน)
    const sorted = data.sort((a: any, b: any) => b.pId - a.pId);
    setProducts(sorted);
    setFiltered(sorted);
  } catch (err) {
    console.error("Failed to load products", err);
  } finally {
    setLoading(false);
  }
};

  const loadCategories = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  const handleCategoryClick = (catId: number | null) => {
    setSelectedCat(catId);
    setFiltered(catId === null ? products : products.filter((p) => p.pcId === catId));
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        MySwal.fire({
          title: "Error",
          text: "Missing token. Please login first.",
          icon: "error",
        });
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        MySwal.fire({
          title: "Deleted!",
          text: `Product "${products.find(p => p.pId === id)?.pname}" has been deleted.`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        await loadProducts();
      } else {
        MySwal.fire({
          title: "Failed",
          text: "Failed to delete product",
          icon: "error",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openCategoryModal = (product: Product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleAddToCategory = async (categoryId: number) => {
    if (!selectedProduct) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${selectedProduct.pId}/category`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  },
  body: JSON.stringify({ pcId: categoryId }),
});


      if (res.ok) {
        MySwal.fire({
          title: "Added!",
          text: `Product "${selectedProduct.pname}" added to "${categories.find(c => c.id === categoryId)?.name}"`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        setShowModal(false);
        loadProducts();
      } else {
        MySwal.fire({
          title: "Failed",
          text: "Failed to add category",
          icon: "error",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="panel">
      <div className="panel__title">Products by Category</div>

      {/* ---------- Categories Bar ---------- */}
      <div className="category-bar">
        <button
          className={`cat-btn ${selectedCat === null ? "active" : ""}`}
          onClick={() => handleCategoryClick(null)}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`cat-btn ${selectedCat === cat.id ? "active" : ""}`}
            onClick={() => handleCategoryClick(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* ---------- Products Table ---------- */}
      {loading ? (
        <p>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={{ padding: 16 }}>No products found for this category.</p>
      ) : (
        <table className="products-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Name</th>
              <th>Base Price</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.pId}>
                <td>{p.pId}</td>
                <td>{p.primaryImageUrl ? <img src={p.primaryImageUrl} alt={p.pname} className="table-img" /> : "-"}</td>
                <td>{p.pname}</td>
                <td>฿ {p.basePrice}</td>
                <td>{p.pcId ? categories.find(c => c.id === p.pcId)?.name || "-" : "-"}</td>
                <td>
                  {/* <button className="btn btn--edit" onClick={() => navigate(`../add-product?id=${p.pId}`)}><FaPen /> Edit</button>
                  <button className="btn btn--delete" onClick={() => handleDelete(p.pId)}><FaTrash /> Delete</button> */}
                  <button className="btn btn--category" onClick={() => openCategoryModal(p)}><FaTags /> Add to Category</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ---------- Modal ---------- */}
      {showModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>
              Add <span style={{ color: "#c24" }}>{selectedProduct.pname}</span> to Category
            </h3>
            <div className="modal-categories">
              {categories.map((cat) => (
                <button key={cat.id} className="cat-select-btn" onClick={() => handleAddToCategory(cat.id)}>
                  {cat.name}
                </button>
              ))}
            </div>
            <button className="btn btn--cancel" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Floating Add Button */}
      {/* <button className="fab" onClick={() => navigate("../add-product")}><FaPlus /></button> */}
    </div>
  );
}
