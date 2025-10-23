import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import "./AddProduct.css";

type Category = {
  id: number;
  name: string;
};

type Variant = {
  id?: number;
  shadeName: string;
  shadeCode: string;
  price: number | string;
  stockQty: number | string;
  imageUrl: string;
};

export default function AddProduct() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");

  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState<any>({
    pname: "",
    description: "",
    basePrice: "",
    pcId: "",
    primaryImageUrl: "",
    images: "",
    variants: [] as Variant[],
  });

  // ---------- โหลดหมวดหมู่ ----------
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      const data = await res.json();
      if (res.ok) setCategories(data);
      else console.error("Failed to load categories", data.message);
    } catch (err) {
      console.error("Error loading categories", err);
    }
  };

  // ---------- โหลดข้อมูลตอนแก้ไข ----------
  useEffect(() => {
    if (!editId) return;
    loadProduct(Number(editId));
  }, [editId]);

  const loadProduct = async (id: number) => {
    try {
      console.log("Fetching product id:", id);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/products/${id}`
      );
      const data = await res.json();

      if (res.ok) {
        setForm({
          pname: data.pname || "",
          description: data.description || "",
          basePrice: data.basePrice || "",
          pcId: data.pcId || "",
          primaryImageUrl: data.primaryImageUrl || "",
          images: (data.images || []).join(","),
          variants:
            data.variants?.map((v: any) => ({
              id: v.id,
              shadeName: v.shadeName || "",
              shadeCode: v.shadeCode || "",
              price: v.price || data.basePrice || "",
              stockQty: v.stockQty || "",
              imageUrl: v.imageUrl || "",
            })) || [],
        });
      } else {
        Swal.fire("Error", "Product not found", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load product", "error");
    }
  };

  // ---------- Handle change ----------
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  // ---------- Handle variant change ----------
  const handleVariantChange = (
    index: number,
    key: keyof Variant,
    value: string
  ) => {
    setForm((prev: any) => {
      const newVariants = [...prev.variants];
      newVariants[index] = {
        ...newVariants[index],
        [key]: key === "price" || key === "stockQty" ? Number(value) : value,
      };
      return { ...prev, variants: newVariants };
    });
  };

  // ---------- Upload ----------
  const uploadToMinio = async (file: File): Promise<string | null> => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return null;

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/files/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) return data.url;
      Swal.fire("Upload failed", data.message || "Unknown error", "error");
      return null;
    } catch (err) {
      console.error(err);
      Swal.fire("Upload Error", "Something went wrong", "error");
      return null;
    }
  };

  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string,
    variantIndex?: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadedUrl = await uploadToMinio(file);
    if (uploadedUrl) {
      if (key === "primaryImageUrl") {
        setForm((prev: any) => ({ ...prev, primaryImageUrl: uploadedUrl }));
      } else if (variantIndex !== undefined) {
        setForm((prev: any) => {
          const newVariants = [...prev.variants];
          newVariants[variantIndex] = {
            ...newVariants[variantIndex],
            imageUrl: uploadedUrl,
          };
          return { ...prev, variants: newVariants };
        });
      }
    }
  };

  // ---------- เพิ่ม/ลบ variant ----------
  const addVariant = () => {
    setForm((prev: any) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { shadeName: "", shadeCode: "", price: "", stockQty: "", imageUrl: "" },
      ],
    }));
  };

  const removeVariant = (index: number) => {
    setForm((prev: any) => ({
      ...prev,
      variants: prev.variants.filter((_: any, i: number) => i !== index),
    }));
  };


  // ---------- Submit ----------
  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        Swal.fire({
          title: "Please login",
          icon: "warning",
          position: "center",
        });
        return;
      }

      // const payload = {
      //   pname: form.pname,
      //   description: form.description,
      //   basePrice: Number(form.basePrice),
      //   pcId: Number(form.pcId) || null,
      //   primaryImageUrl: form.primaryImageUrl,
      //   images: form.images ? form.images.split(",") : [],
      //   variants: form.variants.map((v: Variant) => ({
      //     id: v.id,
      //     shadeName: v.shadeName,
      //     shadeCode: v.shadeCode,
      //     price: Number(v.price) || Number(form.basePrice),
      //     stockQty: Number(v.stockQty) || 0,
      //     imageUrl: v.imageUrl,
      //   })),
      // };

      const payload = {
        pname: form.pname,
        description: form.description,
        basePrice: Number(form.basePrice),
        pcId: Number(form.pcId) || null,
        primaryImageUrl: form.primaryImageUrl,
        images: form.images ? form.images.split(",") : [],
        variants: form.variants.map((v: Variant) => ({
          id: v.id,
          shadeName: v.shadeName,
          shadeCode: v.shadeCode,
          price: Number(v.price) || Number(form.basePrice),
          stockQty: Number(v.stockQty) || 0,
          imageUrl: v.imageUrl,
        })),
      };

      const url = editId
        ? `${import.meta.env.VITE_API_URL}/api/products/${editId}`
        : `${import.meta.env.VITE_API_URL}/api/products`;

      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          title: editId ? "Product Updated!" : "Product Added!",
          icon: "success",
          position: "center",
          confirmButtonColor: "#3085d6",
        });
      } else {
        Swal.fire({
          title: "Failed",
          text: data.message || "Unknown error",
          icon: "error",
          position: "center",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Error",
        text: "⚠️ Error while saving product.",
        icon: "error",
        position: "center",
      });
    }
  };

  return (
    <div className="panel">
      <div className="panel__title">
        {editId ? "Edit Product" : "Add New Product"}
      </div>

      <div className="modal-two-col">
        {/* LEFT */}
        <div className="modal-section">
          <label>Product Name</label>
          <input
            name="pname"
            value={form.pname}
            onChange={handleChange}
            placeholder="Product Name"
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
          />

          <label>Category</label>
          <select
            name="pcId"
            value={form.pcId}
            onChange={handleChange}
            className="category-dropdown"
          >
            <option value="">-- Select Category --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* RIGHT */}
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
        </div>
      </div>

      {/* Variant Section */}
      <h4>Variants</h4>

      {form.variants.map((v: Variant, i: number) => (
        <div className="variant-card" key={i}>
          <div className="modal-grid">
            <input
              value={v.shadeName}
              onChange={(e) =>
                handleVariantChange(i, "shadeName", e.target.value)
              }
              placeholder="Shade Name"
            />
            <input
              value={v.shadeCode}
              onChange={(e) =>
                handleVariantChange(i, "shadeCode", e.target.value)
              }
              placeholder="Shade Code (#FFF)"
            />
            <input
              type="number"
              value={v.price}
              onChange={(e) => handleVariantChange(i, "price", e.target.value)}
              placeholder="Price"
            />
            <input
              type="number"
              value={v.stockQty}
              onChange={(e) =>
                handleVariantChange(i, "stockQty", e.target.value)
              }
              placeholder="Stock Qty"
            />
          </div>

          <div className="variant-image">
            <label>Variant Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e, "imageUrl", i)}
            />
            {v.imageUrl && (
              <img src={v.imageUrl} alt="preview" className="preview-img" />
            )}
          </div>

          <button className="btn btn--cancel" onClick={() => removeVariant(i)}>
            Remove
          </button>
        </div>
      ))}

      <button className="btn" onClick={addVariant}>
        + Add Variant
      </button>

      <div className="modal-actions">
        <button className="btn" onClick={handleSubmit}>
          {editId ? "Save Changes" : "Publish Product"}
        </button>
        <button
          className="btn btn--cancel"
          onClick={() => navigate("/products")}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
