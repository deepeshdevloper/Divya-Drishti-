import React, { useState } from 'react';
import { Radio, MapPin, Users, AlertTriangle, Clock, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { User, Zone } from '../../types';

interface EvacuationControlPanelProps {
  zones: Zone[];
  user: User;
}

interface EvacuationPlan {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed';
  fromZones: string[];
  toZones: string[];
  estimatedTime: number;
  peopleAffected: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  activatedAt?: Date;
}

export const EvacuationControlPanel: React.FC<EvacuationControlPanelProps> = ({ zones, user }) => {
  const [evacuationPlans, setEvacuationPlans] = useState<EvacuationPlan[]>([
    {
      id: 'evac-001',
      name: 'Bhairav Ghat Emergency Evacuation',
      status: 'draft',
      fromZones: ['bhairav-ghat'],
      toZones: ['narsingh-ghat', 'kshipra-ghat'],
      estimatedTime: 15,
      peopleAffected: 950,
      priority: 'critical',
      createdAt: new Date(),
    },
    {
      id: 'evac-002',
      name: 'Mahakal Ghat Crowd Redistribution',
      status: 'draft',
      fromZones: ['mahakal-ghat'],
      toZones: ['ram-ghat'],
      estimatedTime: 10,
      peopleAffected: 720,
      priority: 'high',
      createdAt: new Date(Date.now() - 300000),
    }
  ]);

  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [showCreatePlan, setShowCreatePlan] = useState(false);

  const activateEvacuationPlan = (planId: string) => {
    setEvacuationPlans(prev => prev.map(plan => 
      plan.id === planId 
        ? { ...plan, status: 'active' as const, activatedAt: new Date() }
        : plan
    ));
  };

  const completeEvacuationPlan = (planId: string) => {
    setEvacuationPlans(prev => prev.map(plan => 
      plan.id === planId 
        ? { ...plan, status: 'completed' as const }
        : plan
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Radio className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'draft': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const criticalZones = zones.filter(zone => zone.status === 'critical');
  const safeZones = zones.filter(zone => zone.status === 'safe');

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Evacuation Control Center</h2>
            <p className="text-sm text-gray-600">Manage emergency evacuation plans and crowd redistribution</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              criticalZones.length > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {criticalZones.length > 0 ? `${criticalZones.length} Critical Zones` : 'All Zones Safe'}
            </div>
            <button
              onClick={() => setShowCreatePlan(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Plan
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-900">Critical Zones</span>
            </div>
            <p className="text-2xl font-bold text-red-600 mt-1">{criticalZones.length}</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Safe Zones</span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-1">{safeZones.length}</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Radio className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Active Plans</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {evacuationPlans.filter(p => p.status === 'active').length}
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-900">People Affected</span>
            </div>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {evacuationPlans
                .filter(p => p.status === 'active')
                .reduce((sum, p) => sum + p.peopleAffected, 0)
                .toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Evacuation Plans */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Evacuation Plans</h3>
        
        {evacuationPlans.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Radio className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No evacuation plans created</p>
            <p className="text-sm">Create a plan to manage crowd evacuation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {evacuationPlans.map((plan) => (
              <div key={plan.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{plan.name}</h4>
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                        {getStatusIcon(plan.status)}
                        <span className="capitalize">{plan.status}</span>
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(plan.priority)}`}>
                        {plan.priority.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">From:</span>
                        <div className="mt-1">
                          {plan.fromZones.map(zoneId => {
                            const zone = zones.find(z => z.id === zoneId);
                            return (
                              <div key={zoneId} className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span>{zone?.name || zoneId}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium">To:</span>
                        <div className="mt-1">
                          {plan.toZones.map(zoneId => {
                            const zone = zones.find(z => z.id === zoneId);
                            return (
                              <div key={zoneId} className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span>{zone?.name || zoneId}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium">Estimated Time:</span>
                        <div className="flex items-center space-x-1 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{plan.estimatedTime} minutes</span>
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium">People Affected:</span>
                        <div className="flex items-center space-x-1 mt-1">
                          <Users className="w-3 h-3" />
                          <span>{plan.peopleAffected.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {plan.status === 'draft' && (
                      <button
                        onClick={() => activateEvacuationPlan(plan.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Activate
                      </button>
                    )}
                    {plan.status === 'active' && (
                      <button
                        onClick={() => completeEvacuationPlan(plan.id)}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                      >
                        Complete
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedPlan(plan.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
                
                {plan.status === 'active' && plan.activatedAt && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center space-x-2">
                      <Radio className="w-4 h-4 text-green-600 animate-pulse" />
                      <span className="text-sm font-medium text-green-800">
                        Plan activated at {plan.activatedAt.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emergency Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Emergency Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div className="text-left">
              <div className="font-medium text-red-900">Emergency Broadcast</div>
              <div className="text-sm text-red-700">Send alert to all zones</div>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
            <Radio className="w-6 h-6 text-yellow-600" />
            <div className="text-left">
              <div className="font-medium text-yellow-900">Activate All Plans</div>
              <div className="text-sm text-yellow-700">Execute all evacuation plans</div>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
            <Users className="w-6 h-6 text-blue-600" />
            <div className="text-left">
              <div className="font-medium text-blue-900">Crowd Redistribution</div>
              <div className="text-sm text-blue-700">Balance zone capacities</div>
            </div>
          </button>
        </div>
      </div>

      {/* Communication Panel */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Communication Center</h3>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Quick Messages</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <button className="text-left p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                "Please move to designated safe areas"
              </button>
              <button className="text-left p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                "Follow evacuation route signs"
              </button>
              <button className="text-left p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                "Maintain calm and orderly movement"
              </button>
              <button className="text-left p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                "Emergency services are on standby"
              </button>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Emergency Contacts</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium">Control Room</div>
                <div className="text-blue-700">+91-9876543210</div>
              </div>
              <div>
                <div className="font-medium">Medical Emergency</div>
                <div className="text-blue-700">102</div>
              </div>
              <div>
                <div className="font-medium">Police Control</div>
                <div className="text-blue-700">100</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};