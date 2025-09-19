import React from 'react';
import { User, UserTier, SubscriptionPlan } from '../types.ts';
import { SUBSCRIPTION_PLANS, CREDIT_PACKS } from '../constants.ts';

interface SubscriptionViewProps {
  currentUser: User | null;
  onUpgradeTier: (newTier: UserTier) => void;
}

const CheckIcon = (props: { className?: string }) => <svg {...props} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>;
const CreditIcon = (props: { className?: string }) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 0 0-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582ZM11 12.849v-1.698c.22.07.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.5 2.5 0 0 1-.567.267Z" /><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-2.176-3.873c.394.331.86.593 1.356.78a.75.75 0 0 0 .84-1.22c-.39-.268-.754-.586-1.05-.939l-.02-.021-.004-.004-.014-.014-.004-.004Z M10 8c0 .114.07.34.433.582a2.5 2.5 0 0 0 .567.267v-1.698c-.22.07-.412.164-.567.267C10.07 7.66 10 7.886 10 8Zm1.176 6.127c-.394-.33-.86-.592-1.356-.78a.75.75 0 0 0-.84 1.22c.39.268.754.586 1.05.939l.02.021.004.004.014.014.004-.004ZM11 8a2.5 2.5 0 0 0 .567.267C11.93 7.93 12 7.704 12 7.5c0-.204-.07-.43-.433-.673a2.5 2.5 0 0 0-.567-.267v1.44Z" clipRule="evenodd" /></svg>;


const SubscriptionView: React.FC<SubscriptionViewProps> = ({ currentUser, onUpgradeTier }) => {

  const getPlanActionButton = (plan: SubscriptionPlan) => {
    if (!currentUser) {
        return { text: 'Select Plan', type: 'upgrade' as const };
    }
    if (currentUser.tier === plan.id) {
        return { text: 'Current Plan', type: 'current' as const };
    }
    const currentTierIndex = SUBSCRIPTION_PLANS.findIndex(p => p.id === currentUser.tier);
    const planIndex = SUBSCRIPTION_PLANS.findIndex(p => p.id === plan.id);
    if (planIndex > currentTierIndex) {
        return { text: `Upgrade to ${plan.name}`, type: 'upgrade' as const };
    }
    return { text: `Downgrade to ${plan.name}`, type: 'downgrade' as const };
  };

  const plansToDisplay = SUBSCRIPTION_PLANS.map(plan => ({
      ...plan,
      isCurrent: currentUser?.tier === plan.id,
      actionButton: getPlanActionButton(plan)
  }));
  
  return (
    <div className="p-4 md:p-8 min-h-[calc(100vh-200px)]">
      <div className="mx-auto">
        <h2 className="text-3xl font-bold text-white text-center">Plans & Pricing</h2>
        <p className="mt-4 max-w-2xl mx-auto text-center text-lg text-gray-400">Choose the plan that fits your trading journey.</p>
        
        <div className="mt-12 space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
          {plansToDisplay.map(plan => (
            <div key={plan.id} className={`bg-gray-800 rounded-lg p-8 border ${plan.isCurrent ? 'border-yellow-400 ring-2 ring-yellow-400/50' : 'border-gray-700'} flex flex-col`}>
              <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
              
              <div className="mt-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-base font-medium text-gray-400">{plan.priceFrequency}</span>
              </div>
              <ul className="mt-8 space-y-4 flex-grow">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckIcon className="h-6 w-6 text-green-400" />
                    </div>
                    <p className="ml-3 text-base text-gray-300">{feature}</p>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => plan.actionButton.type !== 'current' && onUpgradeTier(plan.id)}
                disabled={plan.actionButton.type === 'current'}
                className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium
                  ${plan.actionButton.type === 'current' ? 'bg-yellow-500 text-gray-900 cursor-default' : 
                   plan.actionButton.type === 'upgrade' ? 'bg-blue-600 text-white hover:bg-blue-500' :
                   'bg-gray-600 text-white hover:bg-gray-500'}`}
              >
                {plan.actionButton.text}
              </button>
            </div>
          ))}
        </div>
        
        {/* Credit Packs Section */}
        <div className="mt-20">
            <h3 className="text-3xl font-bold text-white text-center">Purchase Additional Credits</h3>
            <p className="mt-4 max-w-2xl mx-auto text-center text-lg text-gray-400">
                Top up your account anytime. Perfect for when you need a few extra analyses.
            </p>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                {CREDIT_PACKS.map(pack => (
                    <div key={pack.name} className="bg-gray-800 rounded-lg p-8 border border-gray-700 flex flex-col text-center">
                        <h4 className="text-xl font-semibold text-white">{pack.name}</h4>
                        <div className="mt-4 flex items-center justify-center gap-2">
                            <CreditIcon className="h-8 w-8 text-yellow-400" />
                            <span className="text-4xl font-bold text-white">{pack.credits}</span>
                        </div>
                        <p className="text-gray-400">Credits</p>

                        <div className="my-6">
                            <span className="text-3xl font-bold text-white">${pack.price.toFixed(2)}</span>
                        </div>

                        <p className="text-sm text-gray-500 flex-grow">{pack.description}</p>
                        
                        <button
                            className="mt-6 block w-full py-2 px-4 rounded-md font-medium bg-green-600 text-white hover:bg-green-700"
                        >
                            Purchase
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionView;