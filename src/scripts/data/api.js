import CONFIG from '../config';

const ENDPOINTS = {
  GET_STORIES: `${CONFIG.BASE_URL}/stories`,
  ADD_STORY: `${CONFIG.BASE_URL}/stories`,
};

export async function getStories() {
  const response = await fetch(ENDPOINTS.GET_STORIES, {
    headers: {
      Authorization: `Bearer ${CONFIG.TOKEN}`,
    },
  });
  return await response.json();
}

export async function addStory({ name, description, lat, lon, photoUrl }) {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('lat', lat);
  formData.append('lon', lon);
  formData.append('photo', photoUrl);

  const response = await fetch(ENDPOINTS.ADD_STORY, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CONFIG.TOKEN}`,
    },
    body: formData,
  });

  return await response.json();
}
