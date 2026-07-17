"use client";

import { Eye, MailPlus, Pencil, Plus, Send, Trash2, UserPlus, Users, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/State";
import { apiFetch, apiRequest, getStoredToken } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useApiData } from "@/lib/useApiData";
import type { Newsletter, NewsletterSubscriber } from "@/types/api";

type NewsletterForm = {
  title: string;
  subject: string;
  previewText: string;
  contentHtml: string;
  contentText: string;
  audienceType: "ALL_SUBSCRIBERS" | "PREMIUM_USERS" | "CUSTOM";
};

type SubscriberForm = {
  email: string;
  name: string;
};

const emptyNewsletter: NewsletterForm = {
  title: "",
  subject: "",
  previewText: "",
  contentHtml: "",
  contentText: "",
  audienceType: "ALL_SUBSCRIBERS"
};

const emptySubscriber: SubscriberForm = {
  email: "",
  name: ""
};

function statusBadge(status: Newsletter["status"]) {
  if (status === "SENT") return "badge-green";
  if (status === "SENDING") return "badge-blue";
  if (status === "FAILED") return "badge-yellow";
  return "badge-grey";
}

export default function NewslettersPage() {
  const newsletters = useApiData<Newsletter[]>("/admin/newsletters", true);
  const subscribers = useApiData<NewsletterSubscriber[]>("/admin/newsletters/subscribers", true);
  const [newsletterForm, setNewsletterForm] = useState<NewsletterForm>(emptyNewsletter);
  const [subscriberForm, setSubscriberForm] = useState<SubscriberForm>(emptySubscriber);
  const [openNewsletter, setOpenNewsletter] = useState(false);
  const [openSubscriber, setOpenSubscriber] = useState(false);
  const [openSubscribersList, setOpenSubscribersList] = useState(false);
  const [editingSubscriberId, setEditingSubscriberId] = useState<string | null>(null);
  const [editingSubscriberForm, setEditingSubscriberForm] = useState<SubscriberForm & { isSubscribed: boolean }>({
    email: "",
    name: "",
    isSubscribed: true
  });
  const [previewHtml, setPreviewHtml] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const subscribedCount = useMemo(
    () => subscribers.data?.filter((subscriber) => subscriber.isSubscribed).length ?? 0,
    [subscribers.data]
  );

  function refreshAll() {
    newsletters.reload();
    subscribers.reload();
  }

  function openEditSubscriber(subscriber: NewsletterSubscriber) {
    setEditingSubscriberId(subscriber.id);
    setEditingSubscriberForm({
      email: subscriber.email,
      name: subscriber.name ?? "",
      isSubscribed: subscriber.isSubscribed
    });
  }

  async function createNewsletter(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setActionError("");

    try {
      await apiRequest("/admin/newsletters", {
        method: "POST",
        token: getStoredToken(),
        body: JSON.stringify({
          ...newsletterForm,
          previewText: newsletterForm.previewText || null,
          contentText: newsletterForm.contentText || null
        })
      });
      setOpenNewsletter(false);
      setNewsletterForm(emptyNewsletter);
      newsletters.reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to create newsletter.");
    } finally {
      setSaving(false);
    }
  }

  async function createSubscriber(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setActionError("");

    try {
      await apiRequest("/admin/newsletters/subscribers", {
        method: "POST",
        token: getStoredToken(),
        body: JSON.stringify({
          email: subscriberForm.email,
          name: subscriberForm.name || null
        })
      });
      setOpenSubscriber(false);
      setSubscriberForm(emptySubscriber);
      subscribers.reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to save subscriber.");
    } finally {
      setSaving(false);
    }
  }

  async function updateSubscriber() {
    if (!editingSubscriberId) return;

    setSaving(true);
    setActionError("");

    try {
      await apiRequest(`/admin/newsletters/subscribers/${editingSubscriberId}`, {
        method: "PATCH",
        token: getStoredToken(),
        body: JSON.stringify({
          email: editingSubscriberForm.email,
          name: editingSubscriberForm.name || null,
          isSubscribed: editingSubscriberForm.isSubscribed
        })
      });
      setEditingSubscriberId(null);
      subscribers.reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to update subscriber.");
    } finally {
      setSaving(false);
    }
  }

  async function setSubscriberStatus(subscriber: NewsletterSubscriber, isSubscribed: boolean) {
    setActionError("");

    try {
      await apiRequest(`/admin/newsletters/subscribers/${subscriber.id}`, {
        method: "PATCH",
        token: getStoredToken(),
        body: JSON.stringify({ isSubscribed })
      });
      subscribers.reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to update subscriber status.");
    }
  }

  async function deleteSubscriber(subscriber: NewsletterSubscriber) {
    if (!window.confirm(`Delete subscriber "${subscriber.email}"?`)) return;

    setActionError("");

    try {
      await apiRequest(`/admin/newsletters/subscribers/${subscriber.id}`, {
        method: "DELETE",
        token: getStoredToken()
      });
      if (editingSubscriberId === subscriber.id) {
        setEditingSubscriberId(null);
      }
      subscribers.reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to delete subscriber.");
    }
  }

  async function previewNewsletter(newsletter: Newsletter) {
    setActionError("");
    setPreviewHtml("");

    try {
      const preview = await apiFetch<{ html: string }>(`/admin/newsletters/${newsletter.id}/preview`, {
        method: "POST",
        token: getStoredToken()
      });
      setPreviewHtml(preview.html);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to build preview.");
    }
  }

  async function testSend(newsletter: Newsletter) {
    const email = window.prompt("Send a test newsletter to which email?");
    if (!email) return;

    setActionError("");

    try {
      await apiRequest(`/admin/newsletters/${newsletter.id}/test-send`, {
        method: "POST",
        token: getStoredToken(),
        body: JSON.stringify({ email })
      });
      window.alert("Test newsletter queued.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to send test newsletter.");
    }
  }

  async function sendNewsletter(newsletter: Newsletter) {
    if (!window.confirm(`Send "${newsletter.title}" to ${subscribedCount} subscribed recipient(s)?`)) return;

    setActionError("");

    try {
      await apiRequest(`/admin/newsletters/${newsletter.id}/send`, {
        method: "POST",
        token: getStoredToken()
      });
      refreshAll();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to send newsletter.");
    }
  }

  async function deleteNewsletter(newsletter: Newsletter) {
    if (!window.confirm(`Delete draft "${newsletter.title}"?`)) return;

    setActionError("");

    try {
      await apiRequest(`/admin/newsletters/${newsletter.id}`, {
        method: "DELETE",
        token: getStoredToken()
      });
      newsletters.reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to delete newsletter.");
    }
  }

  return (
    <>
      <PageHeader
        title="Newsletters"
        actions={
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-secondary" onClick={() => setOpenSubscribersList(true)}>
              <Users className="h-4 w-4" /> View Subscribers
            </button>
            <button className="btn btn-secondary" onClick={() => setOpenSubscriber(true)}>
              <UserPlus className="h-4 w-4" /> Add Subscriber
            </button>
            <button className="btn btn-gold" onClick={() => setOpenNewsletter(true)}>
              <Plus className="h-4 w-4" /> New Newsletter
            </button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <div className="card-body">
            <div className="card-subtitle">Drafts</div>
            <div className="stat-value">{newsletters.data?.filter((item) => item.status === "DRAFT").length ?? 0}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="card-subtitle">Subscribed</div>
            <div className="stat-value">{subscribedCount}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="card-subtitle">Sent</div>
            <div className="stat-value">{newsletters.data?.filter((item) => item.status === "SENT").length ?? 0}</div>
          </div>
        </div>
      </div>

      {newsletters.loading || subscribers.loading ? <LoadingState /> : null}
      {newsletters.error ? <ErrorState title="Newsletters could not be loaded" /> : null}
      {subscribers.error ? <ErrorState title="Subscribers could not be loaded" /> : null}
      {actionError ? <div className="mt-4"><ErrorState title="Action failed" message={actionError} /></div> : null}

      {!newsletters.loading && !newsletters.error && !newsletters.data?.length ? (
        <EmptyState title="No newsletters" />
      ) : null}

      {newsletters.data?.length ? (
        <div className="card mt-4">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Newsletter</th>
                  <th>Audience</th>
                  <th>Status</th>
                  <th>Recipients</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {newsletters.data.map((newsletter) => (
                  <tr key={newsletter.id}>
                    <td>
                      <div className="t-name">{newsletter.title}</div>
                      <div className="t-meta">{newsletter.subject}</div>
                    </td>
                    <td>{newsletter.audienceType.replace(/_/g, " ")}</td>
                    <td><span className={`badge ${statusBadge(newsletter.status)}`}>{newsletter.status}</span></td>
                    <td>{newsletter._count?.recipients ?? 0}</td>
                    <td>{formatDate(newsletter.createdAt)}</td>
                    <td>
                      <div className="flex flex-wrap justify-end gap-2">
                        <button className="btn btn-secondary" onClick={() => previewNewsletter(newsletter)}>
                          <Eye className="h-4 w-4" /> Preview
                        </button>
                        <button className="btn btn-secondary" onClick={() => testSend(newsletter)}>
                          <MailPlus className="h-4 w-4" /> Test
                        </button>
                        {newsletter.status === "DRAFT" ? (
                          <button className="btn btn-gold" onClick={() => sendNewsletter(newsletter)}>
                            <Send className="h-4 w-4" /> Send
                          </button>
                        ) : null}
                        {newsletter.status === "DRAFT" ? (
                          <button className="btn btn-ghost text-red-700 hover:text-red-700" onClick={() => deleteNewsletter(newsletter)}>
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {openNewsletter ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal-panel" onSubmit={createNewsletter}>
            <div className="modal-header">
              <div>
                <h2>New Newsletter</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setOpenNewsletter(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="form-grid">
              <label>
                Title
                <input value={newsletterForm.title} onChange={(event) => setNewsletterForm({ ...newsletterForm, title: event.target.value })} required minLength={3} />
              </label>
              <label>
                Subject
                <input value={newsletterForm.subject} onChange={(event) => setNewsletterForm({ ...newsletterForm, subject: event.target.value })} required minLength={3} />
              </label>
              <label>
                Audience
                <select value={newsletterForm.audienceType} onChange={(event) => setNewsletterForm({ ...newsletterForm, audienceType: event.target.value as NewsletterForm["audienceType"] })}>
                  <option value="ALL_SUBSCRIBERS">All subscribers</option>
                  <option value="PREMIUM_USERS">Premium users</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </label>
              <label>
                Preview Text
                <input value={newsletterForm.previewText} onChange={(event) => setNewsletterForm({ ...newsletterForm, previewText: event.target.value })} maxLength={180} />
              </label>
              <label className="md:col-span-2">
                HTML Content
                <textarea value={newsletterForm.contentHtml} onChange={(event) => setNewsletterForm({ ...newsletterForm, contentHtml: event.target.value })} required minLength={10} rows={9} />
              </label>
              <label className="md:col-span-2">
                Plain Text Fallback
                <textarea value={newsletterForm.contentText} onChange={(event) => setNewsletterForm({ ...newsletterForm, contentText: event.target.value })} rows={4} />
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setOpenNewsletter(false)}>Cancel</button>
              <button className="btn btn-gold" disabled={saving}>{saving ? "Saving..." : "Save Draft"}</button>
            </div>
          </form>
        </div>
      ) : null}

      {openSubscriber ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal-panel" onSubmit={createSubscriber}>
            <div className="modal-header">
              <div>
                <h2>Add Subscriber</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setOpenSubscriber(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="form-grid">
              <label>
                Email
                <input value={subscriberForm.email} onChange={(event) => setSubscriberForm({ ...subscriberForm, email: event.target.value })} required type="email" />
              </label>
              <label>
                Name
                <input value={subscriberForm.name} onChange={(event) => setSubscriberForm({ ...subscriberForm, name: event.target.value })} />
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setOpenSubscriber(false)}>Cancel</button>
              <button className="btn btn-gold" disabled={saving}>{saving ? "Saving..." : "Save Subscriber"}</button>
            </div>
          </form>
        </div>
      ) : null}

      {openSubscribersList ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-panel">
            <div className="modal-header">
              <div>
                <h2>Subscribers</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setOpenSubscribersList(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            {subscribers.loading ? <LoadingState /> : null}
            {subscribers.error ? <ErrorState title="Subscribers could not be loaded" /> : null}
            {!subscribers.loading && !subscribers.error && !subscribers.data?.length ? (
              <EmptyState title="No subscribers found" />
            ) : null}

            {subscribers.data?.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.data.map((subscriber) => {
                      const isEditing = editingSubscriberId === subscriber.id;

                      return (
                        <tr key={subscriber.id}>
                          <td>
                            {isEditing ? (
                              <input
                                className="table-input"
                                value={editingSubscriberForm.name}
                                onChange={(event) => setEditingSubscriberForm({ ...editingSubscriberForm, name: event.target.value })}
                                placeholder="Subscriber name"
                              />
                            ) : (
                              <div className="t-name">{subscriber.name || "Unnamed"}</div>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                className="table-input"
                                value={editingSubscriberForm.email}
                                onChange={(event) => setEditingSubscriberForm({ ...editingSubscriberForm, email: event.target.value })}
                                type="email"
                              />
                            ) : (
                              <div className="t-meta">{subscriber.email}</div>
                            )}
                          </td>
                          <td>
                            <select
                              className="table-select"
                              value={isEditing ? String(editingSubscriberForm.isSubscribed) : String(subscriber.isSubscribed)}
                              onChange={(event) => {
                                const isSubscribed = event.target.value === "true";
                                if (isEditing) {
                                  setEditingSubscriberForm({ ...editingSubscriberForm, isSubscribed });
                                  return;
                                }
                                setSubscriberStatus(subscriber, isSubscribed);
                              }}
                            >
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </select>
                          </td>
                          <td>{formatDate(subscriber.createdAt)}</td>
                          <td>
                            <div className="flex flex-wrap justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <button className="btn btn-gold" onClick={updateSubscriber} disabled={saving}>
                                    {saving ? "Saving..." : "Save"}
                                  </button>
                                  <button className="btn btn-secondary" onClick={() => setEditingSubscriberId(null)}>
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button className="btn btn-secondary" onClick={() => openEditSubscriber(subscriber)}>
                                  <Pencil className="h-4 w-4" /> Edit
                                </button>
                              )}
                              <button className="btn btn-ghost text-red-700 hover:text-red-700" onClick={() => deleteSubscriber(subscriber)}>
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
            ) : null}
          </div>
        </div>
      ) : null}

      {previewHtml ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-panel">
            <div className="modal-header">
              <div>
                <h2>Email Preview</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setPreviewHtml("")} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <iframe className="newsletter-preview" srcDoc={previewHtml} title="Newsletter preview" />
          </div>
        </div>
      ) : null}
    </>
  );
}
