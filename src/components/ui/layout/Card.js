import React from 'react';
import PropTypes from 'prop-types';

/**
 * Card component with header, body, and footer sections
 */
const Card = ({ 
  children, 
  className = '',
  hoverable = false,
  ...props 
}) => {
  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 ${
        hoverable ? 'hover:shadow-md hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ 
  children, 
  className = '',
  withBorder = true,
  ...props 
}) => (
  <div 
    className={`px-6 py-4 ${withBorder ? 'border-b border-gray-200 dark:border-gray-700' : ''} ${className}`}
    {...props}
  >
    {children}
  </div>
);

const CardBody = ({ 
  children, 
  className = '',
  padding = true,
  ...props 
}) => (
  <div 
    className={`${padding ? 'p-6' : ''} ${className}`}
    {...props}
  >
    {children}
  </div>
);

const CardFooter = ({ 
  children, 
  className = '',
  withBorder = true,
  ...props 
}) => (
  <div 
    className={`px-6 py-4 bg-gray-50 dark:bg-gray-700/50 ${
      withBorder ? 'border-t border-gray-200 dark:border-gray-700' : ''
    } ${className}`}
    {...props}
  >
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  hoverable: PropTypes.bool,
};

CardHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  withBorder: PropTypes.bool,
};

CardBody.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  padding: PropTypes.bool,
};

CardFooter.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  withBorder: PropTypes.bool,
};

export default Card;
