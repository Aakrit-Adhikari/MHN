"use client";

import { Edit, FilePlus, ImageIcon, Trash2, Upload, X } from "lucide-react";
import { ChangeEvent, FormEvent, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/State";
import { apiRequest, getAssetUrl, getStoredToken } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useApiData } from "@/lib/useApiData";
import type { BlogPost } from "@/types/api";

type BlogForm = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  isPublished: boolean;
  publishedAt: string;
  metaTitle: string;
  metaDescription: string;
};

const emptyBlog: BlogForm = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  author: "",
  category: "",
  isPublished: true,
  publishedAt: "",
  metaTitle: "",
  metaDescription: ""
};

function toForm(post?: BlogPost): BlogForm {
  if (!post) return emptyBlog;

  return {
    slug: post.slug ?? "",
    title: post.title,
    excerpt: post.excerpt ?? "",
    content: post.content,
    author: post.author ?? "",
    category: post.category ?? "",
    isPublished: post.isPublished ?? true,
    publishedAt: post.publishedAt ? post.publishedAt.slice(0, 10) : "",
    metaTitle: post.metaTitle ?? "",
    metaDescription: post.metaDescription ?? ""
  };
}

function getBlogCoverUrl(post: BlogPost) {
  return post.coverImageUrl ?? post.imageUrl ?? null;
}

export default function BlogsPage() {
  const { data, loading, error, reload } = useApiData<BlogPost[]>("/admin/blogs", true);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<BlogForm>(emptyBlog);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);

  function openNew() {
    setEditing(null);
    setForm(emptyBlog);
    setCoverImage(null);
    setActionError("");
    setOpen(true);
  }

  function openEdit(post: BlogPost) {
    setEditing(post);
    setForm(toForm(post));
    setCoverImage(null);
    setActionError("");
    setOpen(true);
  }

  function handleCoverImageChange(event: ChangeEvent<HTMLInputElement>) {
    setCoverImage(event.target.files?.[0] ?? null);
  }

  async function saveBlog(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setActionError("");

    const body = new FormData();
    if (form.slug) body.append("slug", form.slug);
    body.append("title", form.title);
    if (form.excerpt) body.append("excerpt", form.excerpt);
    body.append("content", form.content);
    if (form.author) body.append("author", form.author);
    if (form.category) body.append("category", form.category);
    body.append("isPublished", String(form.isPublished));
    if (form.publishedAt) body.append("publishedAt", form.publishedAt);
    if (form.metaTitle) body.append("metaTitle", form.metaTitle);
    if (form.metaDescription) body.append("metaDescription", form.metaDescription);
    if (coverImage) body.append("coverImage", coverImage);

    try {
      await apiRequest(editing ? `/admin/blogs/${editing.id}` : "/admin/blogs", {
        method: editing ? "PATCH" : "POST",
        token: getStoredToken(),
        body
      });
      setOpen(false);
      setCoverImage(null);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to save blog.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBlog(post: BlogPost) {
    if (!window.confirm(`Delete "${post.title}"?`)) return;

    try {
      await apiRequest(`/admin/blogs/${post.id}`, {
        method: "DELETE",
        token: getStoredToken()
      });
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to delete blog.");
    }
  }

  return (
    <>
      <PageHeader
        title="Blogs"
        description="Create, edit, and remove website blog posts."
        actions={<button className="btn btn-gold" onClick={openNew}><FilePlus className="h-4 w-4" /> New Blog</button>}
      />

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState title="Blogs could not be loaded" message={error.message} /> : null}
      {actionError ? <div className="mb-4"><ErrorState title="Action failed" message={actionError} /></div> : null}
      {!loading && !error && !data?.length ? (
        <EmptyState title="No blogs found" message="Create the first blog post to show it here." />
      ) : null}

      {data?.length ? (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Cover</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.map((post) => {
                  const coverUrl = getBlogCoverUrl(post);
                  const isPublished = post.isPublished ?? true;

                  return (
                    <tr key={post.id}>
                      <td>
                        <div className="t-name">{post.title}</div>
                        <div className="t-meta">{post.slug || post.id}</div>
                      </td>
                      <td>{post.category || "Uncategorized"}</td>
                      <td>
                        {coverUrl ? (
                          <img
                            className="blog-cover-thumb"
                            src={getAssetUrl(coverUrl)}
                            alt=""
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="badge badge-grey">None</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${isPublished ? "badge-green" : "badge-grey"}`}>
                          {isPublished ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td>{formatDate(post.createdAt)}</td>
                      <td>{formatDate(post.updatedAt)}</td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button className="btn btn-secondary" onClick={() => openEdit(post)}>
                            <Edit className="h-4 w-4" /> Edit
                          </button>
                          <button className="btn btn-ghost text-red-700 hover:text-red-700" onClick={() => deleteBlog(post)}>
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal-panel" onSubmit={saveBlog}>
            <div className="modal-header">
              <div>
                <h2>{editing ? "Edit Blog" : "New Blog"}</h2>
                <p>{editing ? "Update the selected post." : "Add a new website blog post."}</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="form-grid">
              <label>
                Title
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required minLength={3} />
              </label>
              <label>
                Slug
                <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="auto-generated if blank" />
              </label>
              <label>
                Author
                <input value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} />
              </label>
              <label>
                Category
                <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
              </label>
              <label className="md:col-span-2">
                Excerpt
                <textarea value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} maxLength={255} rows={3} />
              </label>
              <label className="md:col-span-2">
                Content
                <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} required minLength={10} rows={10} />
              </label>
              <label>
                Published Date
                <input value={form.publishedAt} onChange={(event) => setForm({ ...form, publishedAt: event.target.value })} type="date" />
              </label>
              <label className="checkbox-row">
                <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} />
                Published
              </label>
              <label className="md:col-span-2">
                Cover Image
                <span className="file-input-row">
                  <Upload className="h-4 w-4" />
                  <input type="file" accept="image/*" onChange={handleCoverImageChange} />
                </span>
                {coverImage ? (
                  <span className="file-input-meta">{coverImage.name}</span>
                ) : editing && getBlogCoverUrl(editing) ? (
                  <span className="file-input-meta">Current image will be kept unless you choose a new one.</span>
                ) : null}
              </label>
              <label>
                SEO Title
                <input value={form.metaTitle} onChange={(event) => setForm({ ...form, metaTitle: event.target.value })} />
              </label>
              <label>
                SEO Description
                <textarea value={form.metaDescription} onChange={(event) => setForm({ ...form, metaDescription: event.target.value })} maxLength={255} rows={3} />
              </label>
              <div className="md:col-span-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <ImageIcon className="h-4 w-4" />
                {editing && getBlogCoverUrl(editing) ? "Cover image attached" : "No cover image attached"}
              </div>
            </div>

            {actionError ? <p className="form-error">{actionError}</p> : null}

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-gold" disabled={saving}>{saving ? "Saving..." : "Save Blog"}</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
