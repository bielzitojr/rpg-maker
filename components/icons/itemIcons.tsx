import React from 'react';

type IconProps = {
  className?: string;
};

// Icons for Inventory Categories
export const WeaponIcon: React.FC<IconProps> = ({ className }) => ( <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5-3 3z"/><path d="M5 15l-2 2 5 5 2-2"/><path d="M19 9l-2 2 5 5 2-2"/></svg> );
export const ArmorIcon: React.FC<IconProps> = ({ className }) => ( <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l7 4-7 4-7-4 7-4z"/><path d="M5 10l7 4 7-4"/><path d="M5 18l7-4 7 4"/></svg> );
export const ConsumableIcon: React.FC<IconProps> = ({ className }) => ( <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/><path d="M12 6v6l4 2"/></svg> );
export const QuestIcon: React.FC<IconProps> = ({ className }) => ( <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg> );
export const KeyIcon: React.FC<IconProps> = ({ className }) => ( <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M12 11.5L21 3l-1.5 1.5L18 3l1.5 1.5L18 6l1.5 1.5L18 9l1.5 1.5"/></svg> );
export const OtherIcon: React.FC<IconProps> = ({ className }) => ( <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12L4 12"/><path d="M20 6L4 6"/><path d="M20 18L4 18"/></svg> );
