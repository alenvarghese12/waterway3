import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from '@emotion/styled';

const Container = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f5f5f5;
  flex-direction: column;

  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const Sidebar = styled.div`
  width: 100%;
  background-color: white;
  padding: 20px;
  box-shadow: 2px 0 5px rgba(0,0,0,0.1);

  @media (min-width: 768px) {
    width: 250px;
    padding: 40px;
    height: 100vh;
    position: sticky;
    top: 0;
  }
`;

const FoodSelectionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { ownerId, selectedFoodItems: initialSelectedItems } = location.state || {};
  
  const [foodItems, setFoodItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [selectedFoodItems, setSelectedFoodItems] = useState(initialSelectedItems || {});

  useEffect(() => {
    const fetchFoodItems = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/food/food-items/${ownerId}`);
        const items = response.data;
        setFoodItems(items);
        
        // Create categories with counts
        const categoryMap = items.reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {});
        
        const categoryList = Object.entries(categoryMap).map(([name, count]) => ({
          name,
          count
        }));
        
        setCategories([
          { name: 'All Items', count: items.length },
          ...categoryList
        ]);
      } catch (error) {
        console.error('Error fetching food items:', error);
      }
    };
    fetchFoodItems();
  }, [ownerId]);

  const filteredItems = selectedCategory === 'All Items' 
    ? foodItems 
    : foodItems.filter(item => item.category === selectedCategory);

  const handleQuantityChange = (foodId, change) => {
    setSelectedFoodItems(prev => {
      const currentQuantity = prev[foodId]?.quantity || 0;
      const newQuantity = Math.max(0, currentQuantity + change);
      
      if (newQuantity === 0) {
        const { [foodId]: removed, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [foodId]: {
          ...prev[foodId],
          quantity: newQuantity
        }
      };
    });
  };

  const calculateTotalAmount = () => {
    return Object.entries(selectedFoodItems).reduce((total, [foodId, { quantity }]) => {
      const foodItem = foodItems.find(item => item._id === foodId);
      return total + (foodItem ? foodItem.price * quantity : 0);
    }, 0);
  };

  const handleSaveSelections = () => {
    const totalFoodAmount = calculateTotalAmount();
    navigate('/userint/boatviewdetails', {
      state: {
        ...location.state,
        selectedFoodItems: selectedFoodItems,
        totalFoodAmount: totalFoodAmount
      }
    });
  };

  const renderFoodCard = (food) => (
    <div key={food._id} style={styles.foodCard}>
      <div style={styles.foodImageContainer}>
        <img 
          src={food.image ? `http://localhost:8080/uploads/${food.image}` : 'default-food.jpg'} 
          alt={food.name}
          style={styles.foodImage}
        />
      </div>
      <div style={styles.foodInfo}>
        <div style={styles.foodHeader}>
          <h3 style={styles.foodName}>{food.name}</h3>
          <span style={styles.foodPrice}>₹{food.price}</span>
        </div>
        <p style={styles.foodDescription}>{food.description}</p>
        <div style={styles.actionContainer}>
          {selectedFoodItems[food._id]?.quantity > 0 ? (
            <div style={styles.quantityControls}>
              <button 
                style={styles.quantityButton}
                onClick={() => handleQuantityChange(food._id, -1)}
              >
                -
              </button>
              <span style={styles.quantity}>
                {selectedFoodItems[food._id].quantity}
              </span>
              <button 
                style={styles.quantityButton}
                onClick={() => handleQuantityChange(food._id, 1)}
              >
                +
              </button>
            </div>
          ) : (
            <button 
              style={styles.addButton}
              onClick={() => handleQuantityChange(food._id, 1)}
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Container>
      <Sidebar>
        {/* <div style={styles.searchContainer}>
          <input 
            type="text" 
            placeholder="Search" 
            style={styles.searchInput}
          />
        </div> */}
        
        <div style={styles.categories}>
          {categories.map(category => (
            <button
              key={category.name}
              style={{
                ...styles.categoryButton,
                ...(selectedCategory === category.name && styles.activeCategory)
              }}
              onClick={() => setSelectedCategory(category.name)}
            >
              <span style={styles.categoryName}>{category.name}</span>
              <span style={styles.itemCount}>{category.count} items</span>
            </button>
          ))}
        </div>
      </Sidebar>

      <div style={styles.mainContent}>
        <h2 style={styles.pageTitle}>{selectedCategory}</h2>
        <div style={styles.foodGrid}>
          {filteredItems.map(food => renderFoodCard(food))}
        </div>
      </div>

      <div style={styles.footer}>
        <div style={styles.totalAmount}>
          <span style={styles.totalLabel}>Total Food Amount:</span>
          <span style={styles.totalValue}>₹{calculateTotalAmount()}</span>
        </div>
        <button onClick={handleSaveSelections} style={styles.saveButton}>
          Save Selections
        </button>
      </div>
    </Container>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '200vh',
    // marginBottom: '-500px',
    backgroundColor: '#f5f5f5',
    flexDirection: 'column',
    '@media (min-width: 768px)': {
      flexDirection: 'row',
    },
  },
  sidebar: {
    width: '100%',
    backgroundColor: 'white',
    padding: '20px',
    boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
    '@media (min-width: 768px)': {
      width: '250px',
      padding: '40px',
      height: '100vh',
      position: 'sticky',
      top: 0,
    },
  },
  searchContainer: {
    marginBottom: '40px',
  },
  searchInput: {
    width: '100%',
    padding: '127px 15px',
    borderRadius: '20px',
    border: '1px solid #ddd',
    fontSize: '16px',
    '-webkit-appearance': 'none',
  },
  categories: {
    marginTop: '100px',
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },
  categoryButton: {
  
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    width: '100%',
  },
  activeCategory: {
    backgroundColor: '#f0f0f0',
    fontWeight: '600',
  },
  categoryName: {
    fontSize: '14px',
    color: '#333',
  },
  itemCount: {
    fontSize: '12px',
    color: '#666',
  },
  mainContent: {
    width: '900px',
    height: '1000px',
  marginTop: '300px',
    flex: 1,
    padding: '15px',
    '@media (min-width: 768px)': {
      padding: '30px 40px',
      marginBottom: '80px',
    },
  },
  pageTitle: {
    margin: '0 0 30px 0',
    color: '#333',
  },
  foodGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    padding: '10px',
    '@media (min-width: 768px)': {
      padding: '20px',
    },
  },
  foodCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    minHeight: '300px',
    transition: 'transform 0.2s ease',
    '@media (min-width: 768px)': {
      flexDirection: 'row',
      height: '200px',
      minHeight: 'auto',
    },
    '&:hover': {
      transform: 'translateY(-2px)',
    }
  },
  foodImageContainer: {
    width: '50%',
    height: '50%',
    '@media (min-width: 768px)': {
      width: '250px',
      minWidth: '250px',
      height: '100%',
    },
    overflow: 'hidden',
    position: 'relative',
  },
  foodImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  foodInfo: {
    padding: '15px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    '@media (min-width: 768px)': {
      padding: '20px',
    },
  },
  foodHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    '@media (min-width: 768px)': {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  },
  foodName: {
    margin: 0,
    fontSize: '18px',
    color: '#333',
    fontWeight: '600',
  },
  foodDescription: {
    margin: '0 0 15px 0',
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.5',
    overflow: 'hidden',
    display: '-webkit-box',
    '-webkit-line-clamp': '3',
    '-webkit-box-orient': 'vertical',
    textOverflow: 'ellipsis',
  },
  foodPrice: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
  },
  actionContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '15px',
    '@media (min-width: 768px)': {
      justifyContent: 'flex-end',
      marginTop: 0,
    },
  },
  addButton: {
    backgroundColor: 'black',
    color: 'white',
    border: 'none',
    padding: '12px 30px',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    width: '100%',
    maxWidth: '200px',
    transition: 'all 0.2s ease',
    '@media (min-width: 768px)': {
      width: 'auto',
    },
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    backgroundColor: '#f8f9fa',
    padding: '8px 15px',
    borderRadius: '25px',
  },
  quantityButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#4CAF50',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    transition: 'all 0.2s ease',
  },
  quantity: {
    minWidth: '30px',
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: '500',
    color: 'black',
  },
  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: '1145px',
    backgroundColor: 'white',
    padding: '10px 15px',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    zIndex: 1000,
    '@media (min-width: 768px)': {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px 30px',
    },
  },
  totalAmount: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    '@media (min-width: 768px)': {
      justifyContent: 'flex-start',
    },
  },
  totalLabel: {
    fontSize: '16px',
    color: '#666',
  },
  totalValue: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: 'black',
    color: 'white',
    border: 'none',
    padding: '12px 30px',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#45a049',
      transform: 'translateY(-2px)',
    }
  },
};

export default FoodSelectionPage;