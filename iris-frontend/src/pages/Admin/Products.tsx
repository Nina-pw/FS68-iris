import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaPen, FaTrash } from "react-icons/fa";
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

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const navigate = useNavigate();

  const [form, setForm] = useState<any>({
    pname: "",
    description: "",
    basePrice: "",
    pcId: "",
    primaryImageUrl: "",
    images: "",
    shadeName: "",
    shadeCode: "",
    price: "",
    stockQty: "",
    imageUrl: "",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  // const loadProducts = async () => {
  //   try {
  //     setLoading(true);
  //     const res = await fetch(`${import.meta.env.VITE_API_URL}/products`);
  //     const data = await res.json();
  //     setProducts(data);
  //   } catch (err) {
  //     console.error("Failed to load products", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };


// แทน loadProducts แบบ fetch variants แยก
// const loadProducts = async () => {
//   try {
//     setLoading(true);
//     const res = await fetch(`${import.meta.env.VITE_API_URL}/products`);
//     const productsData = await res.json();

//     // fetch variants ผ่าน /products/:id
//     const productsWithVariants = await Promise.all(
//       productsData.map(async (p: any) => {
//         const detailRes = await fetch(`${import.meta.env.VITE_API_URL}/products/${p.pId}`);
//         if (!detailRes.ok) return { ...p, variants: [] };
//         const detail = await detailRes.json();
//         return { ...p, variants: detail.variants || [] };
//       })
//     );

//     setProducts(productsWithVariants);
//   } catch (err) {
//     console.error(err);
//   } finally {
//     setLoading(false);
//   }
// };


const loadProducts = async () => {
  try {
    setLoading(true);
    const res = await fetch(`${import.meta.env.VITE_API_URL}/products`);
    const productsData = await res.json();

    const productsWithVariants = await Promise.all(
      productsData.map(async (p: any) => {
        const detailRes = await fetch(`${import.meta.env.VITE_API_URL}/products/${p.pId}`);
        if (!detailRes.ok) return { ...p, variants: [] };
        const detail = await detailRes.json();
        return { ...p, variants: detail.variants || [] };
      })
    );

    // sort ให้สินค้าใหม่อยู่บนสุด
    productsWithVariants.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA; // ใหม่ -> เก่า
    });

    setProducts(productsWithVariants);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  // เพิ่มฟังก์ชัน upload ไป MinIO
  const uploadToMinio = async (file: File): Promise<string | null> => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("❌ Missing token. Please login first.");
        return null;
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/files/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // ป้องกันต้อง login ก่อน
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        return data.url; // URL ของไฟล์ใน MinIO
      } else {
        alert(`❌ Upload failed: ${data.message}`);
        return null;
      }
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  };

  // ฟังก์ชัน handleFile ใหม่
  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadedUrl = await uploadToMinio(file);
    if (uploadedUrl) {
      setForm((prev: any) => ({ ...prev, [key]: uploadedUrl }));
    }
  };

  // const handleSubmit = async () => {
  //   try {
  //     const token = localStorage.getItem("accessToken");
  //     if (!token) {
  //       alert("❌ Missing token. Please login first.");
  //       return;
  //     }

  //     const url = editing
  //       ? `${import.meta.env.VITE_API_URL}/products/${editing.pId}`
  //       : `${import.meta.env.VITE_API_URL}/products`;

  //     const method = editing ? "PUT" : "POST";

  //     const res = await fetch(url, {
  //       method,
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({
  //         pname: form.pname,
  //         description: form.description,
  //         basePrice: Number(form.basePrice),
  //         pcId: Number(form.pcId) || null,
  //         primaryImageUrl: form.primaryImageUrl,
  //         images: form.images ? form.images.split(",") : [],
  //         shadeName: form.shadeName,
  //         shadeCode: form.shadeCode,
  //         price: Number(form.price) || Number(form.basePrice),
  //         stockQty: Number(form.stockQty) || 0,
  //         imageUrl: form.imageUrl,
  //       }),
  //     });

  //     const data = await res.json();
  //     if (res.ok) {
  //       alert(editing ? "✅ Product updated!" : "✅ Product added!");
  //       setShowModal(false);
  //       setEditing(null);
  //       resetForm();
  //       await loadProducts();
  //     } else {
  //       alert(`❌ Failed: ${data.message || "Unknown error"}`);
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     alert("⚠️ Error while saving product.");
  //   }
  // };


const handleSubmit = async () => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("❌ Missing token. Please login first.");
      return;
    }

    const url = editing
      ? `${import.meta.env.VITE_API_URL}/products/${editing.pId}`
      : `${import.meta.env.VITE_API_URL}/products`;

    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        pname: form.pname,
        description: form.description,
        basePrice: Number(form.basePrice),
        pcId: Number(form.pcId) || null,
        primaryImageUrl: form.primaryImageUrl,
        images: form.images ? form.images.split(",") : [],
        shadeName: form.shadeName,
        shadeCode: form.shadeCode,
        price: Number(form.price) || Number(form.basePrice),
        stockQty: Number(form.stockQty) || 0,
        imageUrl: form.imageUrl,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      alert(editing ? "✅ Product updated!" : "✅ Product added!");
      setShowModal(false);
      setEditing(null);
      resetForm();

      // 🟢 เพิ่ม/แก้ไข product ให้ขึ้นบนสุด
      setProducts((prev) => {
        // ถ้าแก้ไข ให้เอาออกตัวเก่า
        const filtered = prev.filter((p) => p.pId !== data.pId);
        // prepend ตัวใหม่/แก้ไขล่าสุด
        return [data, ...filtered];
      });

    } else {
      alert(`❌ Failed: ${data.message || "Unknown error"}`);
    }
  } catch (err) {
    console.error(err);
    alert("⚠️ Error while saving product.");
  }
};



 const handleDelete = async (id: number) => {
  const result = await MySwal.fire({
    title: "Are you sure?",
    text: "Do you really want to delete this product?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return; // ถ้า cancel จะไม่ทำอะไร

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

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      MySwal.fire({
        title: "Deleted!",
        text: "The product has been deleted.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      await loadProducts();
    } else {
      const errorText = await res.text();
      console.error("Delete failed:", res.status, errorText);
      MySwal.fire({
        title: "Failed",
        text: `Failed to delete: ${errorText}`,
        icon: "error",
      });
    }
  } catch (err) {
    console.error(err);
    MySwal.fire({
      title: "Error",
      text: "Something went wrong while deleting.",
      icon: "error",
    });
  }
};

  const resetForm = () =>
    setForm({
      pname: "",
      description: "",
      basePrice: "",
      pcId: "",
      primaryImageUrl: "",
      images: "",
      shadeName: "",
      shadeCode: "",
      price: "",
      stockQty: "",
      imageUrl: "",
    });

  return (
    <div className="panel">
      <div className="panel__title">Products</div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="products-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Name</th>
              <th>Base Price</th>
              <th>Variants</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.pId}>
                <td>{p.pId}</td>
                <td>
                  {p.primaryImageUrl ? (
                    <img
                      src={p.primaryImageUrl}
                      alt={p.pname}
                      className="table-img"
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td>{p.pname}</td>
                <td>{p.basePrice}</td>
                <td>
                  {p.variants && p.variants.length > 0 ? (
                    <ul>
                      {p.variants.map((v) => (
                        <li key={v.id}>
                          {v.shadeName || "Default"} - {v.price}฿ ({v.stockQty}{" "}
                          pcs)
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  <button
                    className="btn btn--edit"
                    onClick={() => {
                      // ส่งข้อมูล id ไป AddProduct
                      navigate(`../add-product?id=${p.pId}`);
                    }}
                  >
                    <FaPen className="product-icon" /> Edit
                  </button>
                    
                    {/* <Link
            to="/login"
            state={{ background: location, fromNavIcon: true }}
            aria-label="Login"
          >
            <FaUser className="navbar-icon" />
          </Link> */}

                  <button
                    className="btn btn--delete"
                    onClick={() => handleDelete(p.pId)}
                  >
                    <FaTrash className="product-icon" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Floating Add Button */}
      <button className="fab" onClick={() => navigate("../add-product")}>
        <FaPlus className="product-icon" />
      </button>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal fancy" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? "Edit Product" : "Add New Product"}</h3>

            {/* 2 คอลัมน์ */}
            <div className="modal-two-col">
              {/* LEFT - product info */}
              <div className="modal-section">
                <label>Product Name</label>
                <input
                  name="pname"
                  value={form.pname}
                  onChange={handleChange}
                  placeholder="Product Name"
                  required
                />

                <label>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Description"
                />

                <label>Base Price</label>
                <input
                  name="basePrice"
                  type="number"
                  value={form.basePrice}
                  onChange={handleChange}
                  placeholder="Base Price"
                  required
                />

                <label>Category ID</label>
                <input
                  name="pcId"
                  type="number"
                  value={form.pcId}
                  onChange={handleChange}
                  placeholder="Category ID"
                />
              </div>

              {/* RIGHT - image upload */}
              <div className="modal-section">
                <label>Primary Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFile(e, "primaryImageUrl")}
                />
                {form.primaryImageUrl && (
                  <img
                    src={form.primaryImageUrl}
                    alt="preview"
                    className="preview-img"
                  />
                )}

                <label>Variant Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFile(e, "imageUrl")}
                />
                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt="preview"
                    className="preview-img"
                  />
                )}
              </div>
            </div>

            {/* Variants full row */}
            <h4>Variant</h4>
            <div className="modal-grid">
              <input
                name="shadeName"
                value={form.shadeName}
                onChange={handleChange}
                placeholder="Shade Name"
              />
              <input
                name="shadeCode"
                value={form.shadeCode}
                onChange={handleChange}
                placeholder="Shade Code (#FFF)"
              />
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                placeholder="Price (optional)"
              />
              <input
                name="stockQty"
                type="number"
                value={form.stockQty}
                onChange={handleChange}
                placeholder="Stock Quantity"
              />
              <input
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="Variant Image URL"
              />
            </div>

            <div className="modal-actions">
              <button className="btn" onClick={handleSubmit}>
                Save
              </button>
              <button
                className="btn btn--cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
