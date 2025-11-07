// DeviceScanner.jsx - AI-Powered Device Scanner (NO AUTH - FOR TESTING)
import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Search, 
  Plus, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Loader,
  Package,
  Edit,
  Save
} from 'lucide-react';

const DeviceScanner = ({ 
  apiBaseUrl = 'http://localhost:8000',
  onDeviceAdded,
  setError 
}) => {
  const [scanMode, setScanMode] = useState('manual');
  const [scanType, setScanType] = useState('ai_vision'); // AI Vision as default
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [autoAdd, setAutoAdd] = useState(false);
  const [manualId, setManualId] = useState('');
  const [contextInfo, setContextInfo] = useState({
    department: '',
    location: ''
  });
  const [quickAddForm, setQuickAddForm] = useState({
    serial_number: '',
    name: '',
    type: 'Computer',
    category: 'Hardware',
    manufacturer: '',
    model: '',
    location: '',
    department: ''
  });
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Start camera for live scanning
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setScanMode('camera');
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Capture image from camera
  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return null;
    
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg');
  };

  // Process scan (camera or upload) - NO AUTH
  const processScan = async (imageData) => {
    setScanning(true);
    setScanResult(null);
    
    try {
      const requestBody = {
        image_data: imageData,
        scan_type: scanType,
        auto_add: autoAdd
      };
      
      // Add context if using AI vision
      if (scanType === 'ai_vision' && (contextInfo.department || contextInfo.location)) {
        requestBody.context = contextInfo;
      }
      
      const response = await fetch(`${apiBaseUrl}/api/scanner/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // NO AUTHORIZATION HEADER
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Scan failed');
      }
      
      const data = await response.json();
      setScanResult(data);
      
      // If device was added, notify parent component
      if (data.status === 'success' && (autoAdd || data.message.includes('added'))) {
        if (onDeviceAdded) {
          onDeviceAdded();
        }
      }
      
      // If device not found and not auto-adding, show quick add option
      if (data.status === 'not_found' && !autoAdd) {
        // Pre-fill with AI-extracted data if available
        if (data.asset_data) {
          setQuickAddForm({
            serial_number: data.asset_data.serial_number || data.extracted_id || '',
            name: data.asset_data.name || '',
            type: data.asset_data.type || 'Computer',
            category: 'Hardware',
            manufacturer: data.asset_data.manufacturer || '',
            model: data.asset_data.model || '',
            location: data.asset_data.location || contextInfo.location || '',
            department: data.asset_data.department || contextInfo.department || ''
          });
        } else {
          setQuickAddForm(prev => ({
            ...prev,
            serial_number: data.extracted_id || ''
          }));
        }
        setShowQuickAdd(true);
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Scan error:', err);
    } finally {
      setScanning(false);
    }
  };

  // Handle camera scan
  const handleCameraScan = () => {
    const imageData = captureImage();
    if (imageData) {
      processScan(imageData);
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      processScan(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle manual ID entry - NO AUTH
  const handleManualScan = async () => {
    if (!manualId.trim()) {
      setError('Please enter a valid ID');
      return;
    }
    
    setScanning(true);
    setScanResult(null);
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/scanner/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // NO AUTHORIZATION HEADER
        },
        body: JSON.stringify({
          manual_id: manualId,
          scan_type: 'manual',
          auto_add: autoAdd
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Lookup failed');
      }
      
      const data = await response.json();
      setScanResult(data);
      
      if (data.status === 'success' && onDeviceAdded) {
        onDeviceAdded();
      }
      
      if (data.status === 'not_found' && !autoAdd) {
        setQuickAddForm(prev => ({
          ...prev,
          serial_number: manualId
        }));
        setShowQuickAdd(true);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  };

  // Quick add device - NO AUTH
  const handleQuickAdd = async () => {
    if (!quickAddForm.serial_number || !quickAddForm.name) {
      setError('Serial number and name are required');
      return;
    }
    
    setScanning(true);
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/scanner/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // NO AUTHORIZATION HEADER
        },
        body: JSON.stringify(quickAddForm)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add device');
      }
      
      const data = await response.json();
      
      setScanResult({
        status: 'success',
        message: 'Device added successfully',
        asset_data: data
      });
      
      setShowQuickAdd(false);
      setQuickAddForm({
        serial_number: '',
        name: '',
        type: 'Computer',
        category: 'Hardware',
        manufacturer: '',
        model: '',
        location: '',
        department: ''
      });
      
      if (onDeviceAdded) {
        onDeviceAdded();
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scanner Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Device Scanner</h2>
        
        {/* Mode Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scan Mode
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => { setScanMode('manual'); stopCamera(); }}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                scanMode === 'manual' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 border'
              }`}
            >
              <Edit className="w-4 h-4" />
              <span>Manual</span>
            </button>
            <button
              onClick={() => { setScanMode('upload'); stopCamera(); }}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                scanMode === 'upload' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 border'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>📸 AI Scan (Upload)</span>
            </button>
            <button
              onClick={() => startCamera()}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                scanMode === 'camera' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 border'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>📸 AI Scan (Camera)</span>
            </button>
          </div>
        </div>

        {/* Scan Type (for camera/upload modes) - UPDATED WITH AI */}
        {scanMode !== 'manual' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scan Method
            </label>
            <select
              value={scanType}
              onChange={(e) => setScanType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ai_vision">🤖 AI Vision </option>
              <option value="manual">✍️ Manual Entry</option>
              <option value="barcode">📊 Barcode (Legacy)</option>
              <option value="qr_code">🔲 QR Code (Legacy)</option>
            </select>
            {scanType === 'ai_vision' && (
              <p className="mt-2 text-sm text-green-600">
                ✨ AI will extract serial number, manufacturer, model, and suggest user assignments
              </p>
            )}
          </div>
        )}

        {/* Auto-add toggle */}
        <div className="mb-6 flex items-center">
          <input
            type="checkbox"
            id="auto-add"
            checked={autoAdd}
            onChange={(e) => setAutoAdd(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="auto-add" className="text-sm text-gray-700">
            Automatically add devices if not found in database
          </label>
        </div>

        {/* Context Input for Better AI Suggestions - NEW */}
        {scanMode !== 'manual' && scanType === 'ai_vision' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <span className="mr-2">🎯</span>
              Context (Optional - Helps AI make better suggestions)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Department</label>
                <input
                  type="text"
                  value={contextInfo.department}
                  onChange={(e) => setContextInfo(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g., IT, Engineering"
                  className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Location</label>
                <input
                  type="text"
                  value={contextInfo.location}
                  onChange={(e) => setContextInfo(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Building A, Floor 3"
                  className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Scanner Interface */}
        {/* Manual Entry */}
        {scanMode === 'manual' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Device ID / Serial Number
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="e.g., SN123456789"
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleManualScan();
                    }
                  }}
                />
                <button
                  onClick={handleManualScan}
                  disabled={scanning}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
                >
                  {scanning ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  <span>Search</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload */}
        {scanMode === 'upload' && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Upload device image for AI scanning</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {scanning ? 'AI Processing...' : 'Choose File'}
            </button>
          </div>
        )}

        {/* Camera */}
        {scanMode === 'camera' && (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ maxHeight: '400px' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <button
              onClick={handleCameraScan}
              disabled={scanning}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {scanning ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>AI Processing...</span>
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  <span>Capture & AI Scan</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Scan Result - ENHANCED WITH AI DATA */}
      {scanResult && (
        <div className={`p-4 rounded-lg border ${
          scanResult.status === 'success' 
            ? 'bg-green-50 border-green-200' 
            : scanResult.status === 'not_found'
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start space-x-3">
            {scanResult.status === 'success' ? (
              <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
            ) : scanResult.status === 'not_found' ? (
              <AlertCircle className="w-6 h-6 text-yellow-600 mt-1" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 mt-1" />
            )}
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">
                  {scanResult.message}
                </h3>
                {/* AI Confidence Badge */}
                {scanResult.confidence && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    scanResult.confidence > 0.8 
                      ? 'bg-green-100 text-green-800' 
                      : scanResult.confidence > 0.6
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {scanResult.confidence > 0.8 ? '🎯' : '⚠️'} 
                    {' '}{(scanResult.confidence * 100).toFixed(0)}% Confidence
                  </span>
                )}
              </div>

              {/* Extracted Text Display */}
              {scanResult.extracted_text && (
                <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">📄 Extracted Text:</h4>
                  <p className="text-sm text-gray-600 font-mono whitespace-pre-wrap">{scanResult.extracted_text}</p>
                </div>
              )}
              
              {/* Device Details */}
              {scanResult.asset_data && (
                <div className="mt-3 p-3 bg-white rounded border">
                  <h4 className="font-medium text-gray-700 mb-2">Device Details:</h4>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Name:</dt>
                      <dd className="font-medium">{scanResult.asset_data.name}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Serial Number:</dt>
                      <dd className="font-medium">{scanResult.asset_data.serialNumber || scanResult.asset_data.serial_number}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Type:</dt>
                      <dd className="font-medium">{scanResult.asset_data.type}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Status:</dt>
                      <dd className="font-medium">{scanResult.asset_data.status || 'Active'}</dd>
                    </div>
                    {scanResult.asset_data.manufacturer && (
                      <div>
                        <dt className="text-gray-500">Manufacturer:</dt>
                        <dd className="font-medium">{scanResult.asset_data.manufacturer}</dd>
                      </div>
                    )}
                    {scanResult.asset_data.model && (
                      <div>
                        <dt className="text-gray-500">Model:</dt>
                        <dd className="font-medium">{scanResult.asset_data.model}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* User Assignment Suggestions - NEW */}
              {scanResult.user_suggestions && scanResult.user_suggestions.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                    <span className="mr-2">👥</span>
                    Recommended Assignments:
                  </h4>
                  <div className="space-y-2">
                    {scanResult.user_suggestions.map((suggestion, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-2 bg-white rounded border border-blue-100"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{suggestion.user_name}</p>
                          <p className="text-xs text-gray-600">{suggestion.reason}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-blue-600">
                            {(suggestion.confidence * 100).toFixed(0)}%
                          </span>
                          <button
                            onClick={() => {
                              setQuickAddForm(prev => ({ 
                                ...prev, 
                                assignedTo: suggestion.user_name 
                              }));
                              if (scanResult.status === 'not_found') {
                                setShowQuickAdd(true);
                              }
                            }}
                            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Recommendations - NEW */}
              {scanResult.ai_recommendations && scanResult.ai_recommendations.length > 0 && (
                <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded">
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                    <span className="mr-2">💡</span>
                    AI Recommendations:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {scanResult.ai_recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {scanResult.extracted_id && !scanResult.asset_data && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Extracted ID: <span className="font-mono font-medium">{scanResult.extracted_id}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Form - ENHANCED WITH AI PRE-FILL INDICATOR */}
      {showQuickAdd && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          {scanResult?.confidence && (
            <div className="mb-3 p-2 bg-blue-100 border border-blue-300 rounded text-sm">
              <span className="font-semibold">🤖 AI Pre-filled this form</span> with {(scanResult.confidence * 100).toFixed(0)}% confidence
            </div>
          )}
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Quick Add Device
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Serial Number *</label>
              <input
                type="text"
                value={quickAddForm.serial_number}
                onChange={(e) => setQuickAddForm(prev => ({ ...prev, serial_number: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={quickAddForm.name}
                onChange={(e) => setQuickAddForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Type</label>
              <select
                value={quickAddForm.type}
                onChange={(e) => setQuickAddForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Computer">Computer</option>
                <option value="Laptop">Laptop</option>
                <option value="Monitor">Monitor</option>
                <option value="Printer">Printer</option>
                <option value="Phone">Phone</option>
                <option value="Tablet">Tablet</option>
                <option value="Server">Server</option>
                <option value="Network Device">Network Device</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Department</label>
              <input
                type="text"
                value={quickAddForm.department}
                onChange={(e) => setQuickAddForm(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Manufacturer</label>
              <input
                type="text"
                value={quickAddForm.manufacturer}
                onChange={(e) => setQuickAddForm(prev => ({ ...prev, manufacturer: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Model</label>
              <input
                type="text"
                value={quickAddForm.model}
                onChange={(e) => setQuickAddForm(prev => ({ ...prev, model: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              onClick={handleQuickAdd}
              disabled={scanning}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center space-x-2"
            >
              {scanning ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>Add Device</span>
            </button>
            <button
              onClick={() => setShowQuickAdd(false)}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceScanner;