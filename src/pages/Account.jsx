import React, { useState, useRef, useEffect } from "react";
import { useReactor, useSelector } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import {
  toggleTheme,
  updateCurrency,
  signOut,
  toggleHideBalance,
  refreshRates,
  updateProfileImage,
} from "../store/actions.js";
import { selectWalletTotal, selectSavingsTotal, selectInvestmentsTotal } from "../store/selectors.js";
import { getExchangeRates } from "../utils/currency.js";
import CurrencyFormatter from "../components/CurrencyFormatter.jsx";
import ProfileAvatar from "../components/ProfileAvatar.jsx";
import { prepareProfileImage } from "../utils/profileImage.js";
import { FaSignOutAlt, FaCog, FaSyncAlt, FaCamera, FaTrash, FaCheck, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Account() {
  const state = useReactor(store);
  const user = state.auth.user;
  const theme = state.ui.theme;
  const currency = state.ui.currency;
  const hideBalance = state.ui.hideBalance;
  const profileImage = user?.profileImage || "";
  const profileImagePosition = user?.profileImagePosition || { x: 50, y: 50 };
  const profileImagePositionX = profileImagePosition.x;
  const profileImagePositionY = profileImagePosition.y;
  const navigate = useNavigate();
  const walletTotal = useSelector(store, selectWalletTotal);
  const savingsTotal = useSelector(store, selectSavingsTotal);
  const investmentsTotal = useSelector(store, selectInvestmentsTotal);

  const [showSettings, setShowSettings] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [profileImageCandidate, setProfileImageCandidate] = useState("");
  const [profileImagePositionDraft, setProfileImagePositionDraft] = useState(profileImagePosition);
  const [profileImageError, setProfileImageError] = useState("");
  const [isSavingProfileImage, setIsSavingProfileImage] = useState(false);

  const currencyRef = useRef(null);
  const profileImageInputRef = useRef(null);

  const currencies = ["NGN", "USD", "EUR", "GBP", "GHS"];
  const rates = getExchangeRates();

  useEffect(() => {
    document.title = "SaveMyWay — Account";
  }, []);

  useEffect(() => {
    setProfileImagePositionDraft({
      x: profileImagePositionX,
      y: profileImagePositionY,
    });
  }, [profileImagePositionX, profileImagePositionY]);

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

  const handleProfileImageChange = async (event) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    setProfileImageError("");
    try {
      const preparedImage = await prepareProfileImage(file);
      setProfileImageCandidate(preparedImage);
      setProfileImagePositionDraft(profileImagePosition);
    } catch (error) {
      setProfileImageError(error.message || "This image could not be used.");
    }
  };

  const handleSaveProfileImage = () => {
    setIsSavingProfileImage(true);
    const nextImage = profileImageCandidate || profileImage;
    const saved = updateProfileImage(nextImage, profileImagePositionDraft);
    setIsSavingProfileImage(false);

    if (!saved) {
      setProfileImageError("The photo could not be saved. Free some browser storage and try again.");
      return;
    }

    setProfileImageCandidate("");
    setProfileImageError("");
  };

  const handleRemoveProfileImage = () => {
    const removed = updateProfileImage("");
    if (!removed) {
      setProfileImageError("The photo could not be removed. Please try again.");
      return;
    }
    setProfileImageCandidate("");
    setProfileImagePositionDraft({ x: 50, y: 50 });
    setProfileImageError("");
  };

  const cropHasChanged =
    profileImagePositionDraft.x !== profileImagePosition.x ||
    profileImagePositionDraft.y !== profileImagePosition.y;

  return (
    <div className="account-page">
      <div className="card account-card">
        <h2 className="section-title">Profile</h2>

        <div className="profile-photo-editor">
          <ProfileAvatar
            className="profile-avatar-lg"
            imageOverride={profileImageCandidate || undefined}
            positionOverride={profileImagePositionDraft}
            accessibleLabel={`${profileImageCandidate ? "Preview" : "Current"} profile photo for ${user?.name || "your account"}`}
          />
          <div className="profile-photo-controls">
            <input
              ref={profileImageInputRef}
              className="profile-image-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleProfileImageChange}
              aria-label="Choose a profile image"
            />
            <div className="profile-photo-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => profileImageInputRef.current?.click()}
              >
                <FaCamera />
                {profileImage ? "Change photo" : "Choose photo"}
              </button>
              {profileImage && !profileImageCandidate && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleRemoveProfileImage}
                >
                  <FaTrash />
                  Remove
                </button>
              )}
            </div>

            {(profileImage || profileImageCandidate) && (
              <div className="profile-crop-controls">
                <label htmlFor="profile-crop-x">Horizontal framing</label>
                <input
                  id="profile-crop-x"
                  type="range"
                  min="0"
                  max="100"
                  value={profileImagePositionDraft.x}
                  onChange={(event) =>
                    setProfileImagePositionDraft((position) => ({
                      ...position,
                      x: Number(event.target.value),
                    }))
                  }
                />
                <label htmlFor="profile-crop-y">Vertical framing</label>
                <input
                  id="profile-crop-y"
                  type="range"
                  min="0"
                  max="100"
                  value={profileImagePositionDraft.y}
                  onChange={(event) =>
                    setProfileImagePositionDraft((position) => ({
                      ...position,
                      y: Number(event.target.value),
                    }))
                  }
                />
              </div>
            )}

            {(profileImageCandidate || cropHasChanged) && (
              <div className="profile-photo-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveProfileImage}
                  disabled={isSavingProfileImage}
                >
                  <FaCheck />
                  {profileImageCandidate ? "Use photo" : "Save framing"}
                </button>
                {profileImageCandidate && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setProfileImageCandidate("");
                      setProfileImagePositionDraft(profileImagePosition);
                    }}
                  >
                    <FaTimes />
                    Cancel
                  </button>
                )}
              </div>
            )}
            {profileImageError && (
              <p className="profile-image-error" role="alert">{profileImageError}</p>
            )}
          </div>
        </div>

        {user?.name && (
          <div className="account-info-row">
            <span>Name</span>
            <strong>{user.name}</strong>
          </div>
        )}

        <div className="account-info-row">
          <span>Email</span>
          <strong>{user?.email || "Not signed in"}</strong>
        </div>

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

      <div className="card account-card">
        <div className="settings-header">
          <h2 className="section-title">Settings</h2>

          <button
            className={`settings-btn ${showSettings ? "open" : ""}`}
            onClick={() => setShowSettings((prev) => !prev)}
            aria-label="Toggle settings"
          >
            <FaCog />
          </button>
        </div>

        {showSettings && (
          <div className="settings-content">
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
                  {syncing ? "Syncing..." : "Sync Rates"}
                </button>
              </div>
              <p className="rates-text">
                $1 USD = ₦{rates.NGN?.toFixed(2)} NGN • €{rates.EUR?.toFixed(4)} EUR • £{rates.GBP?.toFixed(4)} GBP • ₵{rates.GHS?.toFixed(2)} GHS
              </p>
              <p className="rates-disclaimer">
                NGN uses the app&apos;s configured reference rate. Other rates may
                vary by provider and update time.
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
        )}
      </div>

      <div className="logout-wrap">
        <button className="btn btn-danger logout-btn" onClick={handleLogout}>
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </div>
  );
}
