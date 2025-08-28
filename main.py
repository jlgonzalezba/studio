# This file will contain your Python backend logic.
# For this example, we'll create a simple function.
# In a real-world scenario, you would need a web framework like Flask or FastAPI
# to expose this function as an API endpoint.

def convert_kg_to_lbs(kilograms):
  """Converts kilograms to pounds."""
  if not isinstance(kilograms, (int, float)):
    raise TypeError("Input must be a number.")
  return kilograms * 2.20462

# Example of how you might use it:
# print(convert_kg_to_lbs(10)) # Output: 22.0462
