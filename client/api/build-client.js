import axios from 'axios';

export default ({ req }) => {
  const isProduction = process.env.NODE_ENV === 'production';
  if (typeof window === 'undefined') {
    // We are on the server
    return axios.create({
      baseURL: isProduction
        ? 'http://www.my-tickets.store/'
        : 'http://ingress-nginx-controller.ingress-nginx.svc.cluster.local',
      headers: req.headers,
    });
  } else {
    // We must be on the browser
    return axios.create({
      baseUrl: '/',
    });
  }
};
