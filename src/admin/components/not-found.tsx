import React from 'react';
import { Link } from '@admin/components/links';
import logo from '../assets/logo.svg';

const NotFound: React.FC<any> = () => {
  return (
    <div className="d-flex flex-column justify-content-center container text-center min-vh-100">
      <img
        src={logo}
        alt="Burdy"
        width={96}
        height={96}
        className="mb-4 mx-auto"
      />
      <h1 className="mb-5">404 Not Found</h1>
      <Link to="/" className="btn btn-primary mx-auto">
        Back to Index
      </Link>
    </div>
  );
};

export default NotFound;
