import React, { useState } from "react";

const PrimaryButton = ({ label, className, onClick}) => {
  
  return (
    <button
      className={`${className} text-primary bg-highlight hover:bg-hover disabled:bg-disable border-0 
          rounded-[15px] px-[15px] py-[12px] flex items-center justify-center font-[500]`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default PrimaryButton;
