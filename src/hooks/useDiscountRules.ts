import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

interface DiscountRule {
  id: string;
  clientId: string;
  clientName: string;
  productId: string;
  productName: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  active: boolean;
}

export const useDiscountRules = (username: string) => {
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscountRules = async () => {
      if (!username) {
        console.log('No username provided to useDiscountRules');
        setDiscountRules([]);
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching discount rules for username:', username);
        const q = query(
          collection(db, 'discountRules'),
          where('clientId', '==', username.toLowerCase()),  // Ensure case-insensitive comparison
          where('active', '==', true)
        );

        const snapshot = await getDocs(q);
        console.log('Firestore query results:', {
          username,
          queryPath: q.toString(),
          numResults: snapshot.size,
          docs: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        });

        const rules = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DiscountRule[];

        console.log('Parsed discount rules:', rules);
        setDiscountRules(rules);
      } catch (error) {
        console.error('Error fetching discount rules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscountRules();
  }, [username]);

  const getDiscountedPrice = (productId: string, originalPrice: number): number => {
    console.log('Checking discount for:', {
      productId,
      originalPrice,
      availableRules: discountRules.map(r => ({
        ruleId: r.id,
        ruleProductId: r.productId,
        ruleClientId: r.clientId,
        matches: r.productId === productId
      }))
    });

    const rule = discountRules.find(r => r.productId === productId);
    
    if (!rule) {
      console.log('No matching discount rule found for:', {
        productId,
        availableRuleIds: discountRules.map(r => r.productId)
      });
      return originalPrice;
    }

    console.log('Found matching discount rule:', rule);
    
    if (rule.discountType === 'percentage') {
      const discounted = originalPrice * (1 - rule.discountValue / 100);
      console.log('Applied percentage discount:', {
        originalPrice,
        percentage: rule.discountValue,
        finalPrice: discounted
      });
      return discounted;
    } else {
      const discounted = Math.max(0, originalPrice - rule.discountValue);
      console.log('Applied fixed discount:', {
        originalPrice,
        deduction: rule.discountValue,
        finalPrice: discounted
      });
      return discounted;
    }
  };

  return {
    discountRules,
    loading,
    getDiscountedPrice
  };
};
