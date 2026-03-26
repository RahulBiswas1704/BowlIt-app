"use client";

import { useState, useMemo, useEffect } from "react";
import { MapPin, Building, Info, Save, Loader2, Plus, Home, Briefcase, Navigation, Trash2, CheckCircle2, AlertTriangle, LocateFixed } from "lucide-react";

// Standard Next.js workaround for Leaflet SSR issues
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { supabase } from "@/app/lib/supabaseClient";
import { SavedAddress } from "@/app/types";

// Dynamically import Leaflet components so they don't crash on the server
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Polygon = dynamic(() => import('react-leaflet').then(m => m.Polygon), { ssr: false });

// Helper to determine if point is inside a polygon using ray-casting
function isPointInPolygon(point: { lat: number, lng: number }, polygon: { lat: number, lng: number }[]) {
    if (!polygon || polygon.length < 3) return true; // Allow all if no polygon defined
    let x = point.lat, y = point.lng;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i].lat, yi = polygon[i].lng;
        let xj = polygon[j].lat, yj = polygon[j].lng;
        let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Helper to get center of polygon
function getPolygonCenter(polygon: { lat: number, lng: number }[]) {
    if (!polygon || polygon.length === 0) return DEFAULT_CENTER;
    let minLat = polygon[0].lat, maxLat = polygon[0].lat;
    let minLng = polygon[0].lng, maxLng = polygon[0].lng;
    for (const p of polygon) {
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
        if (p.lng < minLng) minLng = p.lng;
        if (p.lng > maxLng) maxLng = p.lng;
    }
    return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
}

// KOLKATA DEFAULT COORDINATES
const DEFAULT_CENTER = { lat: 22.5726, lng: 88.3639 };

export function AddressManager({ userId }: { userId: string }) {
    const [isClient, setIsClient] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Core Data
    const [addresses, setAddresses] = useState<SavedAddress[]>([]);
    const [geofencePolygon, setGeofencePolygon] = useState<{ lat: number, lng: number }[]>([]);

    // View State
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [addStep, setAddStep] = useState<1 | 2>(1);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

    // Waitlist State
    const [showWaitlistModal, setShowWaitlistModal] = useState(false);
    const [waitlistPhone, setWaitlistPhone] = useState("");
    const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);

    // Form Data for New/Edit Address
    const [formData, setFormData] = useState<Partial<SavedAddress>>({
        tag: "Home",
        latitude: undefined,
        longitude: undefined,
        building_name: "",
        office: "",
        delivery_instructions: ""
    });

    // Custom Map Icon using pure CSS to bypass CDN blocking
    const markerIcon = useMemo(() => {
        if (typeof window !== 'undefined') {
            const L = require('leaflet');
            return L.divIcon({
                className: 'custom-pin',
                html: `<div style="background-color: #ea580c; width: 20px; height: 20px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 24],
            });
        }
        return null;
    }, []);

    useEffect(() => {
        setIsClient(true);
        const fetchData = async () => {
            // 1. Fetch User Addresses
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.user_metadata?.phone) {
                setWaitlistPhone(user.user_metadata.phone);
            }
            if (user?.user_metadata?.saved_addresses) {
                setAddresses(user.user_metadata.saved_addresses);
            } else if (user?.user_metadata?.latitude) {
                // Legacy Migration support
                const legacyAddress: SavedAddress = {
                    id: Date.now().toString(),
                    tag: "Home",
                    latitude: user.user_metadata.latitude,
                    longitude: user.user_metadata.longitude,
                    building_name: user.user_metadata.building_name || "",
                    office: user.user_metadata.office || "",
                    delivery_instructions: user.user_metadata.delivery_instructions || "",
                    is_default: true
                };
                setAddresses([legacyAddress]);
                // Automatically persist migration
                await supabase.auth.updateUser({ data: { saved_addresses: [legacyAddress] } });
            }

            // 2. Fetch Admin Geofence settings
            try {
                const res = await fetch('/api/admin/settings');
                const adminData = await res.json();
                if (adminData.settings && adminData.settings.geofence_polygon) {
                    setGeofencePolygon(adminData.settings.geofence_polygon);
                }
            } catch (err) {
                console.error("Failed to fetch geofence", err);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    // Helper component to bind click events to the map
    const MapEvents = dynamic(
        () => import('react-leaflet').then(m => {
            return ({ onClick }: { onClick: any }) => {
                m.useMapEvents({ click: onClick });
                return null;
            };
        }),
        { ssr: false }
    );

    const performReverseGeocode = async (lat: number, lng: number) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await res.json();
            if (data && data.display_name) {
                const address = data.address || {};
                const building = address.building || address.amenity || address.shop || address.office || address.residential || "";
                const street = address.road || address.neighbourhood || address.suburb || "";
                let rootAddress = data.display_name.split(',').slice(0, 2).join(',').trim();
                let displayName = building ? `${building}, ${street}` : rootAddress;
                displayName = displayName.replace(/(^[,\s]+)|([,\s]+$)/g, '');
                setFormData(prev => ({ ...prev, building_name: displayName }));
            }
        } catch (err) {
            console.error("Geocoding failed", err);
        }
    };

    const handleMapClick = async (e: any) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
        await performReverseGeocode(lat, lng);
    };

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
            await performReverseGeocode(lat, lng);
        }, () => {
            alert("Unable to retrieve your location. Please check browser permissions.");
        });
    };

    const position = useMemo(() => {
        if (formData.latitude && formData.longitude) {
            return { lat: formData.latitude, lng: formData.longitude };
        }
        return getPolygonCenter(geofencePolygon);
    }, [formData.latitude, formData.longitude, geofencePolygon]);

    const isInsideGeofence = useMemo(() => {
        if (!formData.latitude || !formData.longitude) return true; // Ignore if pin not dropped
        return isPointInPolygon({ lat: formData.latitude, lng: formData.longitude }, geofencePolygon);
    }, [formData.latitude, formData.longitude, geofencePolygon]);


    const handleSaveAddress = async () => {
        if (!formData.latitude || !formData.longitude) return alert("Please drop a pin on the map!");
        if (!formData.building_name || !formData.office) return alert("Please fill address details!");

        // WAITLIST INTERCEPTION
        if (!isInsideGeofence) {
            setShowWaitlistModal(true);
            return;
        }

        setSaving(true);
        let updatedAddresses = [...addresses];

        if (editingAddressId) {
            // Update Existing
            updatedAddresses = updatedAddresses.map(a => a.id === editingAddressId ? { ...a, ...formData } as SavedAddress : a);
        } else {
            // Add New
            const newAddr: SavedAddress = {
                id: Date.now().toString(),
                tag: formData.tag || "Other",
                latitude: formData.latitude,
                longitude: formData.longitude,
                building_name: formData.building_name,
                office: formData.office,
                delivery_instructions: formData.delivery_instructions || "",
                is_default: addresses.length === 0 // Make default if it's the first one
            };
            updatedAddresses.push(newAddr);
        }

        const { error } = await supabase.auth.updateUser({ data: { saved_addresses: updatedAddresses } });
        if (error) {
            alert("Error saving address: " + error.message);
        } else {
            setAddresses(updatedAddresses);
            setIsAddingNew(false);
            setEditingAddressId(null);
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this address?")) return;
        const updated = addresses.filter(a => a.id !== id);
        if (updated.length > 0 && !updated.find(a => a.is_default)) {
            updated[0].is_default = true; // Ensure at least 1 default
        }
        await supabase.auth.updateUser({ data: { saved_addresses: updated } });
        setAddresses(updated);
    };

    const handleSetDefault = async (id: string) => {
        const updated = addresses.map(a => ({ ...a, is_default: a.id === id }));
        await supabase.auth.updateUser({ data: { saved_addresses: updated } });
        setAddresses(updated);
    };

    const resetForm = () => {
        setFormData({ tag: "Home", latitude: undefined, longitude: undefined, building_name: "", office: "", delivery_instructions: "" });
        setIsAddingNew(false);
        setEditingAddressId(null);
        setAddStep(1);
    };

    const editAddress = (addr: SavedAddress) => {
        setFormData({ ...addr });
        setEditingAddressId(addr.id);
        setIsAddingNew(true);
        setAddStep(2);
    };

    const MapIcon = ({ tag, size = 18 }: { tag: string, size?: number }) => {
        if (tag === 'Home') return <Home size={size} />;
        if (tag === 'Work') return <Briefcase size={size} />;
        return <Navigation size={size} />;
    };

    const handleJoinWaitlist = async () => {
        if (!waitlistPhone) return alert("Please enter your phone number");
        setIsJoiningWaitlist(true);
        try {
            const res = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: waitlistPhone,
                    latitude: formData.latitude,
                    longitude: formData.longitude
                })
            });
            if (!res.ok) throw new Error("Failed to join waitlist");

            alert("Awesome! You're on the waitlist. We will text you when BowlIt opens in your area.");
            setShowWaitlistModal(false);
            resetForm();
        } catch (e: any) {
            alert(e.message);
        }
        setIsJoiningWaitlist(false);
    };

    if (loading) return <div className="p-8 text-center text-gray-400 font-bold flex justify-center items-center"><Loader2 className="animate-spin mr-2" /> Loading Addresses...</div>;

    // WAITLIST MODAL OVERLAY
    if (showWaitlistModal) {
        return (
            <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-orange-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-red-500"></div>
                <div className="mx-auto w-20 h-20 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-6 ring-8 ring-orange-50/50">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-4 tracking-tight">We're not in your area... <span className="text-orange-600">yet!</span></h3>
                <p className="text-gray-500 max-w-md mx-auto mb-8 font-medium">
                    BowlIt is expanding rapidly across the city. Drop your phone number below, and we'll send you an exclusive Day-1 discount the moment we open a kitchen near your dropped pin.
                </p>

                <div className="max-w-xs mx-auto space-y-4">
                    <input
                        type="text"
                        placeholder="Phone Number"
                        value={waitlistPhone}
                        onChange={e => setWaitlistPhone(e.target.value)}
                        className="w-full text-center border-2 border-gray-200 focus:border-orange-500 p-4 rounded-xl font-bold bg-gray-50 outline-none transition-colors"
                    />
                    <button
                        onClick={handleJoinWaitlist}
                        disabled={!waitlistPhone || isJoiningWaitlist}
                        className="w-full bg-black hover:bg-gray-800 text-white font-bold p-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isJoiningWaitlist ? <Loader2 className="animate-spin" size={20} /> : "Join the Waitlist"}
                    </button>
                    <button
                        onClick={() => setShowWaitlistModal(false)}
                        className="w-full text-gray-500 hover:text-gray-900 font-bold p-2 text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                        <MapPin size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Delivery Addresses</h3>
                        <p className="text-sm text-gray-500">Manage where your meals are delivered.</p>
                    </div>
                </div>
                {!isAddingNew && (
                    <button onClick={() => setIsAddingNew(true)} className="bg-orange-100 hover:bg-orange-200 text-orange-700 p-2 lg:px-4 lg:py-2 rounded-xl flex items-center gap-2 font-bold transition-colors">
                        <Plus size={18} /> <span className="hidden lg:block">Add New</span>
                    </button>
                )}
            </div>

            {/* LIST ALL SAVED ADDRESSES */}
            {!isAddingNew && (
                <div className="grid md:grid-cols-2 gap-4">
                    {addresses.length === 0 ? (
                        <div className="col-span-2 p-8 text-center border-2 border-dashed rounded-2xl bg-gray-50 flex flex-col items-center justify-center">
                            <MapPin className="text-gray-300 mb-2" size={32} />
                            <p className="text-gray-500 font-bold">No delivery addresses saved yet.</p>
                            <button onClick={() => setIsAddingNew(true)} className="mt-4 text-orange-600 font-bold hover:underline">Add your first address</button>
                        </div>
                    ) : (
                        addresses.map((addr) => (
                            <div key={addr.id} className={`p-5 rounded-2xl border-2 transition-all relative ${addr.is_default ? 'border-orange-500 bg-orange-50/30 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                                {addr.is_default && <span className="absolute top-4 right-4 bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 size={12} /> DEFAULT</span>}

                                <div className="flex items-start gap-4 mb-4">
                                    <div className="p-3 bg-gray-100 text-gray-600 rounded-xl"><MapIcon tag={addr.tag} size={20} /></div>
                                    <div>
                                        <h4 className="font-bold text-lg text-gray-900">{addr.tag}</h4>
                                        <p className="text-sm font-medium text-gray-700 mt-1">{addr.building_name}</p>
                                        <p className="text-xs text-gray-500">{addr.office}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4 border-t border-gray-100">
                                    {!addr.is_default && <button onClick={() => handleSetDefault(addr.id)} className="text-xs font-bold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition">Set Default</button>}
                                    <button onClick={() => editAddress(addr)} className="text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition">Edit</button>
                                    <div className="flex-1" />
                                    <button onClick={() => handleDelete(addr.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* SWIGGY-STYLE FULL SCREEN ADDRESS WIZARD */}
            {isAddingNew && (
                <div className="fixed inset-0 z-[9999] bg-gray-50 flex flex-col md:static md:z-auto md:bg-transparent animate-in slide-in-from-bottom-full md:slide-in-from-bottom-4 duration-300">
                    
                    {/* Header for Mobile */}
                    <div className="bg-white p-4 flex items-center gap-4 shadow-sm md:hidden shrink-0 z-10 relative">
                        <button onClick={addStep === 2 && !editingAddressId ? () => setAddStep(1) : resetForm} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        </button>
                        <h2 className="font-black tracking-tight text-lg text-gray-900">{addStep === 1 ? 'Select Delivery Location' : 'Enter Address Details'}</h2>
                    </div>
                    {/* Header Context for Desktop */}
                    <div className="hidden md:flex justify-between items-center mb-4">
                        <h4 className="font-bold text-lg text-gray-900">{addStep === 1 ? 'Select Delivery Location' : 'Enter Address Details'}</h4>
                        <button onClick={resetForm} className="text-sm font-bold text-gray-500 hover:text-gray-800">Cancel</button>
                    </div>

                    <div className="flex-1 flex flex-col md:bg-white md:rounded-[2.5rem] md:border md:border-gray-100 overflow-hidden relative shadow-sm">

                        {addStep === 1 && (
                            <div className="flex-1 flex flex-col h-full absolute inset-0 md:static md:h-[650px] shadow-inner">
                                {/* MAP CONTAINER */}
                                <div className="flex-1 relative z-0">
                                    {isClient ? (
                                        // @ts-ignore
                                        <MapContainer center={[position.lat, position.lng]} zoom={15} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                                            {/* @ts-ignore */}
                                            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                            {/* @ts-ignore */}
                                            {markerIcon && formData.latitude && <Marker position={[position.lat, position.lng]} icon={markerIcon} />}
                                            {/* @ts-ignore */}
                                            <MapEvents onClick={handleMapClick} />
                                            {geofencePolygon.length > 2 && (
                                                // @ts-ignore
                                                <Polygon positions={geofencePolygon.map((p: any) => [p.lat, p.lng])} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1, weight: 2 }} />
                                            )}
                                        </MapContainer>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">Loading Map...</div>
                                    )}
                                    <button onClick={handleLocateMe} className="absolute bottom-6 right-4 z-[1000] bg-white p-3.5 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 text-orange-600 focus:outline-none hover:bg-orange-50 transition-colors">
                                        <LocateFixed size={22} className="stroke-[2.5]"/>
                                    </button>
                                </div>
                                
                                {/* BOTTOM SHEET FOR MAP CONFIGURATION */}
                                <div className="bg-white p-6 md:p-8 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-10 md:rounded-b-[2.5rem]">
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="p-2 bg-orange-50 text-orange-600 rounded-full mt-1 shrink-0"><MapPin size={24} className="stroke-[2.5]" /></div>
                                        <div className="flex-1">
                                            <h3 className="font-black text-gray-900 text-xl tracking-tight line-clamp-1">{formData.building_name || "Select delivery location"}</h3>
                                            <p className="text-gray-500 text-sm mt-1 font-medium">{formData.building_name ? "We'll deliver exactly here" : "Please drop the pin precisely on the map"}</p>
                                        </div>
                                    </div>
                                    {!isInsideGeofence && (
                                        <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-bold flex gap-3 items-center border border-red-100"><AlertTriangle size={20} className="text-red-500 shrink-0"/> This location is currently outside our active delivery zone.</div>
                                    )}
                                    <button
                                        onClick={() => setAddStep(2)}
                                        disabled={!formData.latitude || !isInsideGeofence}
                                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:bg-gray-400 text-lg shadow-xl shadow-orange-600/20"
                                    >
                                        Confirm Location
                                    </button>
                                </div>
                            </div>
                        )}

                        {addStep === 2 && (
                            <div className="flex-1 overflow-y-auto bg-gray-50 md:bg-white p-6 md:px-8 md:pt-8 inset-0 absolute md:static">
                                <div className="max-w-xl mx-auto space-y-6 pb-24">
                                    {/* PREVIEW OF PINNED LOCATION */}
                                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 group">
                                        <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center shrink-0 border border-orange-100"><MapPin size={22} className="stroke-[2.5]" /></div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1">Pinned Location</p>
                                            <p className="font-bold text-gray-900 line-clamp-2 text-sm leading-snug pr-2">{formData.building_name}</p>
                                        </div>
                                        <button onClick={() => setAddStep(1)} className="text-orange-600 font-black text-xs uppercase tracking-widest hover:bg-orange-50 px-3 py-2 rounded-xl transition-colors">Change</button>
                                    </div>

                                    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                                        <div>
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-3">Address Label</label>
                                            <div className="flex items-center gap-3">
                                                {['Home', 'Work', 'Other'].map(tag => (
                                                    <button key={tag} onClick={() => setFormData({ ...formData, tag })} className={`flex-1 py-3.5 rounded-2xl border-2 flex justify-center items-center gap-2 font-bold transition-all ${formData.tag === tag ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                                                        <MapIcon tag={tag} size={18} /> {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">House / Flat / Block No.</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-orange-500 focus:bg-white outline-none transition-all font-bold text-gray-900"
                                                placeholder="e.g. Flat 402, Block C"
                                                value={formData.office || ""}
                                                onChange={(e) => setFormData({ ...formData, office: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Apartment / Road / Area</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-orange-500 focus:bg-white outline-none transition-all font-bold text-gray-900"
                                                placeholder="e.g. DLF Galleria"
                                                value={formData.building_name || ""}
                                                onChange={(e) => setFormData({ ...formData, building_name: e.target.value })}
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Delivery Instructions (Optional)</label>
                                            <input
                                                type="text"
                                                className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-orange-500 focus:bg-white outline-none transition-all font-bold text-gray-900"
                                                placeholder="e.g. Leave with security at main gate"
                                                value={formData.delivery_instructions || ""}
                                                onChange={(e) => setFormData({ ...formData, delivery_instructions: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* FLOATING ACTION BUTTON FOR MOBILE */}
                                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 md:static md:p-0 md:bg-transparent md:border-0 z-50">
                                       <button
                                           onClick={handleSaveAddress}
                                           disabled={saving || !formData.latitude || !formData.building_name || !formData.office}
                                           className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-2xl shadow-black/20 text-lg"
                                       >
                                           {saving ? <Loader2 className="animate-spin" /> : "Save Address Details"}
                                       </button>
                                   </div>
                                </div>
                            </div>
                        )}
                        
                    </div>
                </div>
            )}
        </div>
    );
}
