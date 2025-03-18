// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useParams } from 'react-router-dom';
// import DatePicker from 'react-datepicker';

// const BoatMenu = () => {
//   const { boatId } = useParams(); // Get boatId from URL
//   const [boat, setBoat] = useState(null);
//   const [unavailableDates, setUnavailableDates] = useState([]);
//   const [foodCustomization, setFoodCustomization] = useState('');

//   useEffect(() => {
//     const fetchUserData = async () => {
//       if (localOwnerId) return; // Skip fetching if ownerId is already set
  
//       try {
//         const token = localStorage.getItem('token'); // Retrieve the token from localStorage
//         if (!token) {
//           throw new Error('No token found');
//         }
  
//         const response = await axios.get('http://localhost:8080/api/auth/user-data', {
//           headers: {
//             Authorization: `Bearer ${token}` // Include the token in the Authorization header
//           }
//         });
  
//         const userData = response.data;
//         console.log('Fetched user data:', userData);
  
//         if (userData._id) {
//           setOwnerId(userData._id); // Set ownerId from user data
//         } else {
//           throw new Error('User ID not found in the response');
//         }
//       } catch (error) {
//         console.error('Failed to fetch user data:', error.message);
//         setErrorMessage('Failed to fetch user data. Please check your session or try logging in again.');
//       }
//     };
  
//     fetchUserData();
//   }, [localOwnerId]);
  

//   const handleUnavailableDatesSubmit = async () => {
//     try {
//       await axios.post(`http://localhost:8080/api/boats/${boatId}/unavailable-dates`, { dates: unavailableDates });
//       alert('Unavailable dates updated');
//     } catch (error) {
//       console.error('Error updating unavailable dates:', error);
//     }
//   };

//   const handleFoodCustomizationSubmit = async () => {
//     try {
//       await axios.post(`http://localhost:8080/api/boats/${boatId}/food-customization`, { customization: foodCustomization });
//       alert('Food customization updated');
//     } catch (error) {
//       console.error('Error updating food customization:', error);
//     }
//   };

//   return (
//     <div>
//       {boat ? (
//         <div>
//           <h2>{boat.boatName} ({boat.boatType})</h2>

//           <h3>Edit Boat</h3>
//           {/* Add form to edit boat details */}

//           <h3>Select Unavailable Dates</h3>
//           <DatePicker
//             selected={unavailableDates[0] || null}
//             onChange={(date) => setUnavailableDates([...unavailableDates, date])}
//             selectsStart
//             startDate={unavailableDates[0]}
//             endDate={unavailableDates[unavailableDates.length - 1]}
//             inline
//           />
//           <button onClick={handleUnavailableDatesSubmit}>Save Unavailable Dates</button>

//           <h3>Food Customization</h3>
//           <textarea value={foodCustomization} onChange={(e) => setFoodCustomization(e.target.value)} />
//           <button onClick={handleFoodCustomizationSubmit}>Save Customization</button>
//         </div>
//       ) : (
//         <p>Loading boat details...</p>
//       )}
//     </div>
//   );
// };

// export default BoatMenu;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';

const BoatMenu = () => {
  const { boatId } = useParams(); // Get boatId from URL
  const [boat, setBoat] = useState(null);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [localOwnerId, setLocalOwnerId] = useState(null); // Define localOwnerId as state
  const [foodCustomization, setFoodCustomization] = useState({
    breakfast: [],
    lunch: [],
    dinner: []
  });
  const [newItem, setNewItem] = useState({
    mealType: 'breakfast',
    itemName: '',
    description: '',
    price: '',
    isVegetarian: false,
    options: [{ optionName: '', choices: [''] }]
  });
//selected foods
  const [selectedFoods, setSelectedFoods] = useState({
    breakfast: [],
    lunch: [],
    dinner: []
  });


  // Fetch food customization data on component mount
  useEffect(() => {
    const fetchFoodData = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/food/${boatId}/food`);
        setFoodCustomization(response.data);
      } catch (error) {
        console.error('Error fetching food data:', error);
      }
    };

    fetchFoodData();
  }, [boatId]);

  // Handle food selection for breakfast, lunch, dinner
  const handleFoodSelection = (mealType, foodItem) => {
    setSelectedFoods((prevState) => ({
      ...prevState,
      [mealType]: prevState[mealType].includes(foodItem)
        ? prevState[mealType].filter(item => item !== foodItem) // Deselect if already selected
        : [...prevState[mealType], foodItem] // Add selected food item
    }));
  };

  // Submit selected food
  const handleSubmit = () => {
    console.log('Selected Foods:', selectedFoods);
    // You can send the selectedFoods data to your backend here
  };
  // Fetch boat details on mount
  useEffect(() => {
    const fetchBoatDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/boats/menu/${boatId}`);
        setBoat(response.data);
      } catch (error) {
        console.error('Error fetching boat details:', error);
      }
    };
    fetchBoatDetails();
  }, [boatId]);

  // Example: Fetch localOwnerId or assign a value
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');

        const response = await axios.get('http://localhost:8080/api/auth/user-data', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userData = response.data;
        setLocalOwnerId(userData._id); // Set ownerId
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (!localOwnerId) {
      fetchUserData();
    }
  }, [localOwnerId]);

  const handleUnavailableDatesSubmit = async () => {
    try {
      await axios.post(`http://localhost:8080/api/boats/${boatId}/unavailable-dates`, { dates: unavailableDates });
      alert('Unavailable dates updated');
    } catch (error) {
      console.error('Error updating unavailable dates:', error);
    }
  };

  const handleAddItem = () => {
    setFoodCustomization(prevState => ({
      ...prevState,
      [newItem.mealType]: [...prevState[newItem.mealType], newItem]
    }));
    // Reset newItem form after adding
    setNewItem({
      mealType: 'breakfast',
      itemName: '',
      description: '',
      price: '',
      isVegetarian: false,
      options: [{ optionName: '', choices: [''] }]
    });
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...newItem.options];
    updatedOptions[index].optionName = value;
    setNewItem({ ...newItem, options: updatedOptions });
  };

  const handleChoicesChange = (optionIndex, choiceIndex, value) => {
    const updatedOptions = [...newItem.options];
    updatedOptions[optionIndex].choices[choiceIndex] = value;
    setNewItem({ ...newItem, options: updatedOptions });
  };

  const handleAddOption = () => {
    setNewItem(prevState => ({
      ...prevState,
      options: [...prevState.options, { optionName: '', choices: [''] }]
    }));
  };

  const handleAddChoice = (optionIndex) => {
    const updatedOptions = [...newItem.options];
    updatedOptions[optionIndex].choices.push('');
    setNewItem({ ...newItem, options: updatedOptions });
  };

  const handleFoodCustomizationSubmit = async () => {
    try {
      const foodData = {
        boatId: boatId,
        meals: {
          breakfast: foodCustomization.breakfast,
          lunch: foodCustomization.lunch,
          dinner: foodCustomization.dinner
        }
      };
      await axios.post(`http://localhost:8080/api/food/${boatId}/food`, foodData);
      alert('Food customization updated');
    } catch (error) {
      console.error('Error updating food customization:', error);
    }
  };


  return (
    <div>
      {boat ? (
        <div>
          <h2>{boat.boatName} ({boat.boatType})</h2>

          <h3>Edit Boat</h3>
          {/* Add form to edit boat details */}

          <h3>Select Unavailable Dates</h3>
          <DatePicker
            selected={unavailableDates[0] || null}
            onChange={(date) => setUnavailableDates([...unavailableDates, date])}
            selectsStart
            startDate={unavailableDates[0]}
            endDate={unavailableDates[unavailableDates.length - 1]}
            inline
          />
          <button onClick={handleUnavailableDatesSubmit}>Save Unavailable Dates</button>

          <h3>Food Customization</h3>

<div>
  <select value={newItem.mealType} onChange={(e) => setNewItem({ ...newItem, mealType: e.target.value })}>
    <option value="breakfast">Breakfast</option>
    <option value="lunch">Lunch</option>
    <option value="dinner">Dinner</option>
  </select>
  <input
    type="text"
    placeholder="Item Name"
    value={newItem.itemName}
    onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
  />
  <input
    type="text"
    placeholder="Description"
    value={newItem.description}
    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
  />
  <input
    type="number"
    placeholder="Price"
    value={newItem.price}
    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
  />
  <label>
    <input
      type="checkbox"
      checked={newItem.isVegetarian}
      onChange={(e) => setNewItem({ ...newItem, isVegetarian: e.target.checked })}
    />
    Vegetarian
  </label>

  <h4>Options</h4>
  {newItem.options.map((option, index) => (
    <div key={index}>
      <input
        type="text"
        placeholder="Option Name"
        value={option.optionName}
        onChange={(e) => handleOptionChange(index, e.target.value)}
      />
      {option.choices.map((choice, choiceIndex) => (
        <input
          key={choiceIndex}
          type="text"
          placeholder="Choice"
          value={choice}
          onChange={(e) => handleChoicesChange(index, choiceIndex, e.target.value)}
        />
      ))}
      <button onClick={() => handleAddChoice(index)}>Add Choice</button>
    </div>
  ))}
  <button onClick={handleAddOption}>Add Option</button>

  <button onClick={handleAddItem}>Add Item</button>
</div>

<button onClick={handleFoodCustomizationSubmit}>Save Customization</button>

{/* Display the customized menu for review */}
<div>
  <h3>Current Customization</h3>
  {['breakfast', 'lunch', 'dinner'].map(mealType => (
    <div key={mealType}>
      <h4>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</h4>
      {foodCustomization[mealType] && foodCustomization[mealType].map((item, index) => (
        <div key={index}>
          <p>{item.itemName} - ${item.price} ({item.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'})</p>
          <p>{item.description}</p>
          {item.options.map((option, optionIndex) => (
            <div key={optionIndex}>
              <p>Option: {option.optionName}</p>
              <p>Choices: {option.choices.join(', ')}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  ))}
   <div>
      <h2>Food Customization</h2>

      {['breakfast', 'lunch', 'dinner'].map((mealType) => (
        <div key={mealType}>
          <h3>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</h3>

          {foodCustomization[mealType] && foodCustomization[mealType].map((food, index) => (
            <div key={index}>
              <p>
                {food.itemName} - ${food.price} 
                ({food.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'})
              </p>
              <p>{food.description}</p>

              {/* Checkbox for selecting food items */}
              <label>
                <input
                  type="checkbox"
                  checked={selectedFoods[mealType].includes(food.itemName)}
                  onChange={() => handleFoodSelection(mealType, food.itemName)}
                />
                Select
              </label>
            </div>
          ))}
        </div>
      ))}

      <button onClick={handleSubmit}>Submit Selected Foods</button>
    </div>
  
</div>
</div>
      ) : (
        <p>Loading boat details...</p>
      )}
    </div>
  );
};

export default BoatMenu;
