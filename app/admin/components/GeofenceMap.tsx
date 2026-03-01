"use client";
import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Loader2, Save, MapPin, Trash2 } from "lucide-react";

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Polygon = dynamic(() => import('react-leaflet').then(m => m.Polygon), { ssr: false });

const MapEvents = dynamic(
    () => import('react-leaflet').then(m => {
        return ({ onClick }: { onClick: any }) => {
            m.useMapEvents({ click: onClick });
            return null;
        };
    }),
    { ssr: false }
);

interface GeofenceMapProps {
    polygon: { lat: number, lng: number }[];
    setPolygon: (polygon: { lat: number, lng: number }[]) => void;
    onSave: () => void;
    saving: boolean;
}

export function GeofenceMap({ polygon, setPolygon, onSave, saving }: GeofenceMapProps) {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => setIsClient(true), []);

    const handleMapClick = (e: any) => {
        setPolygon([...(polygon || []), { lat: e.latlng.lat, lng: e.latlng.lng }]);
    };

    const handleClear = () => {
        setPolygon([]);
    };

    const handleUndo = () => {
        if (!polygon || polygon.length === 0) return;
        setPolygon(polygon.slice(0, -1));
    };

    // KOLKATA DEFAULT
    const center = { lat: 22.5726, lng: 88.3639 };

    // Find center based on polygon if exists
    const mapCenter = polygon && polygon.length > 0 ? polygon[0] : center;

    return (
        <div className="bg-white rounded-2xl border shadow-sm p-6 overflow-hidden flex flex-col h-[700px] w-full max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900"><MapPin className="text-red-500" /> Draw Delivery Zone</h2>
                    <p className="text-sm text-gray-500">Tap on the map to define delivery boundaries. Connect 3 or more points.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleUndo} disabled={!polygon || polygon.length === 0} className="px-4 py-2 bg-gray-100 rounded-xl font-bold disabled:opacity-50 text-gray-700 hover:bg-gray-200 transition-colors">Undo Last</button>
                    <button onClick={handleClear} disabled={!polygon || polygon.length === 0} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-red-100 transition-colors"><Trash2 size={16} /> Clear Map</button>
                </div>
            </div>

            <div className="flex-1 rounded-2xl overflow-hidden border-4 border-gray-100 relative shadow-inner z-0 mb-6 bg-gray-50">
                {isClient ? (
                    // @ts-ignore
                    <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={12} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                        {/* @ts-ignore */}
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        {/* @ts-ignore */}
                        <MapEvents onClick={handleMapClick} />
                        {polygon && polygon.length > 0 && (
                            // @ts-ignore
                            <Polygon positions={polygon.map(p => [p.lat, p.lng])} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2, weight: 3 }} />
                        )}
                    </MapContainer>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold"><Loader2 className="animate-spin mr-2" /> Loading Satellite Arrays...</div>
                )}

                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-3 rounded-xl shadow-md border font-mono text-xs font-bold text-gray-600 z-[1000] pointer-events-none">
                    Points Detected: {polygon?.length || 0}
                </div>
            </div>

            <button
                onClick={onSave}
                disabled={saving || !polygon || polygon.length < 3}
                className="w-full bg-black text-white p-5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-lg"
            >
                {saving ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                {(!polygon || polygon.length < 3) ? "Draw at least 3 points to activate boundary" : "Save Active Geofence"}
            </button>
        </div>
    );
}
