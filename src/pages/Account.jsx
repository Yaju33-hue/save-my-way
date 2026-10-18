import React, { useState, useRef, useEffect } from "react";
import { useReactor, useSelector } from "sia-reactor/adapters/react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { store } from "../store/index.js";
import {
  toggleTheme,
  updateCurrency,
  signOut,
  toggleHideBalance,
  refreshRates,
  updateProfileImage,
  removeProfileImage,
} from "../store/actions.js";
import { selectWalletTotal, selectSavingsTotal, selectInvestmentsTotal } from "../store/selectors.js";
import { getExchangeRates } from "../utils/currency.js";
import CurrencyFormatter from "../components/CurrencyFormatter.jsx";
import UserAvatar from "../components/UserAvatar.jsx";
import ImageCropModal from "../components/ImageCropModal.jsx";
import Search from "./Search.jsx";
import Downloads from "./Downloads.jsx";
import {
  FaSignOutAlt,
  FaCog,
  FaSyncAlt,
  FaCamera,
  FaTrash,
  FaCheck,
  FaUser,
  FaSearch,
  FaDownload,
  FaChevronRight,
} from "react-icons/fa";

export default function Account() {
  const state = useReactor(store);
  const user = state.auth.user;
  const theme = state.ui.theme;
  const currency = state.ui.currency;
  const hideBalance = state.ui.hideBalance;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const walletTotal = useSelector(store, selectWalletTotal);
  const savingsTotal = useSelector(store, selectSavingsTotal);
  const investmentsTotal = useSelector(store, selectInvestmentsTotal);

  // Active sub-tab in My Stuff
  const currentTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(currentTab);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") || "profile";
    setActiveTab(tabFromUrl);
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === "profile") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: tabId });
    }
  };

  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Profile image upload & crop state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState("");

  const fileInputRef = useRef(null);
  const currencyRef = useRef(null);

  const currencies = ["NGN", "USD", "EUR", "GBP", "GHS"];
  const rates = getExchangeRates();

  useEffect(() => {
    document.title = "SaveMyWay — My Stuff";
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target)) {
        setCurrencyOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      signOut();
      navigate("/signin", { replace: true });
    }
  };

  const handleSyncRates = async () => {
    setSyncing(true);
    await refreshRates();
    setTimeout(() => setSyncing(false), 500);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setRawImageSrc(event.target.result);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = "";
  };

  const handleRemoveAvatar = () => {
    if (window.confirm("Remove your current profile photo?")) {
      removeProfileImage();
      setSaveSuccessNotice("Profile photo removed.");
      setTimeout(() => setSaveSuccessNotice(""), 3500);
    }
  };

  return (
    <div className="account-page mystuff-container">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        style={{ display: "none" }}
      />

      {/* Segmented Top Bar for My Stuff */}
      <div className="card mystuff-nav-card">
        <div className="mystuff-tabs-pill">
          <button
            type="button"
            className={`mystuff-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => handleTabChange("profile")}
          >
            <FaUser className="mystuff-tab-icon" />
            <span>Profile</span>
          </button>

          <button
            type="button"
            className={`mystuff-tab-btn ${activeTab === "search" ? "active" : ""}`}
            onClick={() => handleTabChange("search")}
          >
            <FaSearch className="mystuff-tab-icon" />
            <span>Search</span>
          </button>

          <button
            type="button"
            className={`mystuff-tab-btn ${activeTab === "downloads" ? "active" : ""}`}
            onClick={() => handleTabChange("downloads")}
          >
            <FaDownload className="mystuff-tab-icon" />
            <span>Downloads</span>
          </button>

          <button
            type="button"
            className={`mystuff-tab-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => handleTabChange("settings")}
          >
            <FaCog className="mystuff-tab-icon" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PROFILE & OVERVIEW */}
      {activeTab === "profile" && (
        <div className="mystuff-tab-content">
          {/* Profile Card */}
          <div className="card account-card profile-card-primary">
            <div className="profile-header-wrap">
              <div className="profile-avatar-container">
                <UserAvatar user={user} size={84} className="account-main-avatar" />
                <button
                  type="button"
                  className="avatar-edit-badge"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Upload profile picture"
                  title="Upload profile picture"
                >
                  <FaCamera />
                </button>
              </div>

              <div className="profile-header-meta">
                <h2 className="profile-user-name">{user?.name || "Account Profile"}</h2>
                <p className="profile-user-email">{user?.email || "Not signed in"}</p>
                <div className="profile-avatar-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm avatar-action-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FaCamera />
                    <span>{user?.avatarUrl ? "Change Photo" : "Upload Photo"}</span>
                  </button>
                  {user?.avatarUrl && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm avatar-action-btn"
                      onClick={handleRemoveAvatar}
                      title="Remove current avatar"
                    >
                      <FaTrash />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {saveSuccessNotice && (
              <div className="account-notice-success">
                <FaCheck />
                <span>{saveSuccessNotice}</span>
              </div>
            )}

            <div className="profile-details-list">
              {user?.phone && (
                <div className="account-info-row">
                  <span>Phone</span>
                  <strong>{user.phone}</strong>
                </div>
              )}

              <div className="account-info-row">
                <span>Member since</span>
                <strong>
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "N/A"}
                </strong>
              </div>
            </div>
          </div>

          {/* Quick Utility Hub */}
          <div className="mystuff-quick-links-grid">
            <button
              type="button"
              className="card mystuff-quick-action-card"
              onClick={() => handleTabChange("search")}
            >
              <div className="mystuff-quick-icon search-icon-wrap">
                <FaSearch />
              </div>
              <div className="mystuff-quick-text">
                <h4 className="mystuff-quick-title">Search Transactions</h4>
                <p className="mystuff-quick-desc">Find wallet entries, savings targets, and assets</p>
              </div>
              <FaChevronRight className="mystuff-quick-chevron" />
            </button>

            <button
              type="button"
              className="card mystuff-quick-action-card"
              onClick={() => handleTabChange("downloads")}
            >
              <div className="mystuff-quick-icon download-icon-wrap">
                <FaDownload />
              </div>
              <div className="mystuff-quick-text">
                <h4 className="mystuff-quick-title">Downloads & Exports</h4>
                <p className="mystuff-quick-desc">Export financial data to CSV and JSON backups</p>
              </div>
              <FaChevronRight className="mystuff-quick-chevron" />
            </button>
          </div>

          {/* App Summary */}
          <div className="card account-card">
            <h2 className="section-title">App Summary</h2>

            <div className="account-summary-grid">
              <div className="account-summary-box">
                <span className="account-box-label">Total Wallet</span>
                <CurrencyFormatter amount={walletTotal} className="summary-amount" />
              </div>

              <div className="account-summary-box">
                <span className="account-box-label">Total Savings</span>
                <CurrencyFormatter amount={savingsTotal} className="summary-amount" />
              </div>

              <div className="account-summary-box">
                <span className="account-box-label">Total Investments</span>
                <CurrencyFormatter amount={investmentsTotal} className="summary-amount" />
              </div>
            </div>

            <div className="account-info-row">
              <span>Hide Balance</span>
              <strong className={hideBalance ? "status-hidden" : "status-visible"}>
                {hideBalance ? "Hidden" : "Visible"}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTEGRATED SEARCH */}
      {activeTab === "search" && (
        <div className="mystuff-tab-content">
          <Search />
        </div>
      )}

      {/* TAB 3: INTEGRATED DOWNLOADS */}
      {activeTab === "downloads" && (
        <div className="mystuff-tab-content">
          <Downloads />
        </div>
      )}

      {/* TAB 4: SETTINGS */}
      {activeTab === "settings" && (
        <div className="mystuff-tab-content">
          <div className="card account-card">
            <h2 className="section-title">Preferences & Settings</h2>

            <div className="settings-content active">
              <div className="form-group">
                <label className="settings-field-label">Active Display Currency</label>
                <div className="custom-dropdown" ref={currencyRef}>
                  <button
                    type="button"
                    className={`custom-dropdown-btn ${currencyOpen ? "open" : ""}`}
                    onClick={() => setCurrencyOpen((prev) => !prev)}
                  >
                    <span>{currency}</span>
                    <span className="dropdown-arrow">⌄</span>
                  </button>

                  {currencyOpen && (
                    <div className="custom-dropdown-menu">
                      {currencies.map((curr) => (
                        <button
                          key={curr}
                          type="button"
                          className={`custom-dropdown-option ${
                            currency === curr ? "selected" : ""
                          }`}
                          onClick={() => {
                            updateCurrency(curr);
                            setCurrencyOpen(false);
                          }}
                        >
                          {curr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rates-info-card">
                <div className="rates-header">
                  <span className="rates-title">Exchange Rate Reference (USD Base)</span>
                  <button
                    type="button"
                    className="rates-sync-btn"
                    onClick={handleSyncRates}
                    disabled={syncing}
                  >
                    <FaSyncAlt className={syncing ? "spinning" : ""} />
                    {syncing ? "Sync Rates..." : "Sync Rates"}
                  </button>
                </div>
                <p className="rates-text">
                  $1 USD = ₦{rates.NGN?.toFixed(2)} NGN • €{rates.EUR?.toFixed(4)} EUR • £{rates.GBP?.toFixed(4)} GBP • ₵{rates.GHS?.toFixed(2)} GHS
                </p>
                <p className="rates-disclaimer">
                  NGN uses the configured reference rate. Other rates are updated live.
                </p>
              </div>

              <div className="toggle-row">
                <span>Dark Mode</span>

                <label className="custom-toggle">
                  <input
                    type="checkbox"
                    checked={theme === "dark"}
                    onChange={toggleTheme}
                    aria-label="Toggle dark mode"
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="toggle-row">
                <span>Hide Balance</span>

                <label className="custom-toggle">
                  <input
                    type="checkbox"
                    checked={hideBalance}
                    onChange={toggleHideBalance}
                    aria-label="Toggle hide balance"
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="logout-wrap">
            <button className="btn btn-danger logout-btn" onClick={handleLogout}>
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Advanced Resizable & Movable Image Crop Modal */}
      {cropModalOpen && rawImageSrc && (
        <ImageCropModal
          imageSrc={rawImageSrc}
          onClose={() => {
            setCropModalOpen(false);
            setRawImageSrc(null);
          }}
          onSave={(croppedDataUrl) => {
            updateProfileImage(croppedDataUrl);
            setCropModalOpen(false);
            setRawImageSrc(null);
            setSaveSuccessNotice("Profile photo updated successfully!");
            setTimeout(() => setSaveSuccessNotice(""), 3500);
          }}
        />
      )}
    </div>
  );
}
