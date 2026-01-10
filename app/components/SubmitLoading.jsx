import "./submit_loading.css";

export default function SubmitLoading() {
  return (
    <div className="submit-loading-overlay">
      <div className="loader">
        <div className="load-inner load-one"></div>
        <div className="load-inner load-two"></div>
        <div className="load-inner load-three"></div>
        <span className="text">Loading...</span>
      </div>
    </div>
  );
}
