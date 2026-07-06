import React, { useState, useEffect } from 'react';

const Tabs = ({ tabs, initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab || tabs[0]?.label);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  return (
  <div className="w-full mx-auto mt-8 p-10">
  <div className="flex p-1 bg-gray-300 rounded-xl shadow-inner">
    {tabs.map((tab) => (
      <button
        key={tab.label}
        className={`relative flex-1 flex items-center justify-center py-3 px-4 font-medium text-sm rounded-lg focus:outline-none transition-all duration-300 ${
          activeTab === tab.label
            ? 'bg-gradient-to-br from-[#4fbb6b] to-[#4fbb6b] text-white shadow-md text-xl'
            : 'text-[#505D64] hover:bg-gray-200 text-xl'
        }`}
        onClick={() => setActiveTab(tab.label)}
      >
        <div className={`mr-2 transition-transform ${
          activeTab === tab.label ? 'scale-110' : ''
        }`}>
          {React.cloneElement(tab.icon, {
            className: `w-5 h-5 ${activeTab === tab.label ? 'text-white' : 'text-gray-500'}`
          })}
        </div>
        <span>{tab.label}</span>
        {activeTab === tab.label && (
          <div className="absolute -bottom-2 left-1/2 w-4 h-1 bg-blue-400 transform -translate-x-1/2 rounded-full"></div>
        )}
      </button>
    ))}
  </div>

  <div className="mt-4 p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-all duration-300">
    {tabs.find(tab => tab.label === activeTab)?.content}
  </div>
</div>
  );
};

export default Tabs;
